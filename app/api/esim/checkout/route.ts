import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prismadb from '@/lib/prismadb';
import { getDestination, getPlan } from '@/constants/destinations';
import { PAYMENT_CURRENCY, TOKEN_RATE, formatEurFromPoints } from '@/constants/pricing';
import { discountedPoints, getPromoDiscount } from '@/constants/promo';

// POST - Create a direct checkout for an eSIM plan ("Buy Now" flow).
// The price, promo and plan are all resolved server-side — the client only
// sends destinationSlug + planId + promoCode. The webhook fulfils the order:
// it records the eSIM and emails the install instructions once the payment
// completes.
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { destinationSlug, planId, promoCode, quantity } = body as {
      destinationSlug?: string;
      planId?: string;
      promoCode?: string;
      quantity?: number;
    };

    if (!destinationSlug || !planId) {
      return NextResponse.json(
        { error: 'destinationSlug and planId are required' },
        { status: 400 }
      );
    }

    // eSIM count for this order — whole number between 1 and 100
    const qty =
      typeof quantity === 'number' && Number.isFinite(quantity)
        ? Math.min(100, Math.max(1, Math.round(quantity)))
        : 1;

    const destination = getDestination(destinationSlug);
    const plan = destination ? getPlan(destination, planId) : undefined;
    if (!destination || !plan) {
      return NextResponse.json({ error: 'Unknown plan' }, { status: 400 });
    }

    // Promo: absent = no discount; present but unknown = reject
    const promoPercent =
      typeof promoCode === 'string' && promoCode.trim() !== ''
        ? getPromoDiscount(promoCode)
        : 0;
    if (typeof promoCode === 'string' && promoCode.trim() !== '' && !promoPercent) {
      return NextResponse.json({ error: 'Invalid promo code' }, { status: 400 });
    }

    // Price in EUR = charge points × 0.2 (points are 1/5 EUR); the order
    // charges payPoints per eSIM × qty
    const payPoints = discountedPoints(plan.points, promoPercent);
    const totalPoints = payPoints * qty;
    const amountEur = totalPoints * TOKEN_RATE;

    // Buyer email: keep the user row present and current for the webhook
    const emailFromBody = typeof body.email === 'string' ? body.email : undefined;
    const user = await prismadb.user.upsert({
      where: { clerkId: userId },
      update: {},
      create: {
        clerkId: userId,
        email: emailFromBody || '',
        photo: '',
        availableGenerations: 0,
        usedGenerations: 0,
      },
    });
    const customerEmail = user?.email || emailFromBody || '';

    const shopId = process.env.SECURE_PROCESSOR_SHOP_ID;
    const secretKey = process.env.SECURE_PROCESSOR_SECRET_KEY;
    if (!shopId || !secretKey) {
      console.error('❌ SECURE_PROCESSOR credentials are not configured');
      return NextResponse.json(
        { error: 'Payment gateway is not configured' },
        { status: 500 }
      );
    }

    const apiUrl = (process.env.SECURE_PROCESSOR_API_URL || 'https://checkout.secure-processor.com')
      .replace(/\/ctp\/api\/checkouts\/?$/, '');
    const testMode = (process.env.SECURE_PROCESSOR_TEST_MODE || '').toLowerCase() === 'true';

    // The webhook parses the plan, promo and eSIM count back out of the
    // description: "FastBird eSIM — <slug> <planId> [PROMOX] [x<qty>] (<N> EUR)"
    const description = `FastBird eSIM — ${destination.slug} ${plan.id}${
      promoPercent ? ` PROMO${promoPercent}` : ''
    }${qty > 1 ? ` x${qty}` : ''} (${formatEurFromPoints(totalPoints)} EUR)`;

    const amountInCents = Math.round(amountEur * 100);
    const requestData = {
      checkout: {
        test: testMode,
        transaction_type: 'payment',
        order: {
          amount: amountInCents,
          currency: PAYMENT_CURRENCY,
          description,
          // Format matters: the webhook extracts the Clerk id back out of "esim_<clerkId>_<ts>"
          tracking_id: `esim_${userId}_${Date.now()}`,
        },
        customer: { email: customerEmail || 'customer@myfastbird.com' },
        settings: {
          return_url: process.env.SECURE_PROCESSOR_RETURN_URL || 'https://myfastbird.com/payment/success',
          cancel_url: process.env.SECURE_PROCESSOR_CANCEL_URL || 'https://myfastbird.com/payment/cancel',
          notification_url: process.env.SECURE_PROCESSOR_WEBHOOK_URL || 'https://myfastbird.com/api/webhooks/secure-processor',
        },
      },
    };

    const response = await fetch(`${apiUrl}/ctp/api/checkouts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString('base64')}`,
        'X-API-Version': '2',
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Secure-Processor checkout API error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to create payment. Please try again.' },
        { status: 400 }
      );
    }

    const result = await response.json();
    const checkout = result?.checkout;
    if (!checkout?.token || !checkout?.redirect_url) {
      console.error('Secure-Processor checkout response incomplete:', result);
      return NextResponse.json(
        { error: 'Failed to create payment. Please try again.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      redirect_url: checkout.redirect_url,
      amount: formatEurFromPoints(totalPoints),
    });
  } catch (error) {
    console.error('[ESIM_CHECKOUT_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to start checkout. Please try again.' },
      { status: 500 }
    );
  }
}