import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prismadb from '@/lib/prismadb';
import { getDestination, getPlan } from '@/constants/destinations';
import { PAYMENT_CURRENCY, TOKEN_RATE, formatEurFromPoints } from '@/constants/pricing';
import { discountedPoints, getPromoDiscount } from '@/constants/promo';

// POST - Create one payment for the whole cart ("Pay" in the cart drawer).
// The plan, promo and the total are resolved server-side; the pending order
// (Transaction + OrderItem rows) is written before the payment is created so
// the webhook can fulfil it from the database on payment success.
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { items, promoCode } = body as {
      items?: { destinationSlug: string; planId: string }[];
      promoCode?: string;
    };

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // Promo: absent = no discount; present but unknown = reject
    const promoPercent =
      typeof promoCode === 'string' && promoCode.trim() !== ''
        ? getPromoDiscount(promoCode)
        : 0;
    if (typeof promoCode === 'string' && promoCode.trim() !== '' && !promoPercent) {
      return NextResponse.json({ error: 'Invalid promo code' }, { status: 400 });
    }

    // Resolve every line server-side
    const lines: {
      destination: ReturnType<typeof getDestination>;
      plan: ReturnType<typeof getPlan>;
      payPoints: number;
      priceCents: number;
    }[] = [];
    for (const item of items) {
      const destination = getDestination(item.destinationSlug);
      const plan = destination ? getPlan(destination, item.planId) : undefined;
      if (!destination || !plan) {
        return NextResponse.json(
          { error: `Unknown plan for ${item.destinationSlug} — remove it and try again` },
          { status: 400 }
        );
      }
      const payPoints = discountedPoints(plan.points, promoPercent);
      lines.push({
        destination,
        plan,
        payPoints,
        priceCents: Math.round(payPoints * TOKEN_RATE * 100),
      });
    }

    const totalCents = lines.reduce((sum, l) => sum + l.priceCents, 0);
    const totalEur = totalCents / 100;

    // Keep the user row present and current for the webhook
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

    const tracking_id = `cart_${userId}_${Date.now()}`;
    const description = `FastBird eSIM cart — ${lines.length} plan(s)${
      promoPercent ? ` PROMO${promoPercent}` : ''
    } (${formatEurFromPoints(lines.reduce((s, l) => s + l.payPoints, 0))} EUR)`;

    // 1. Persist the pending order atomically (header + line items)
    const savedTransaction = await prismadb.$transaction(async (tx) => {
      const created = await tx.transaction.create({
        data: {
          tracking_id,
          userId,
          status: 'pending',
          amount: totalCents,
          currency: PAYMENT_CURRENCY,
          description,
          type: 'esim_cart',
          payment_method_type: 'card',
          message: `Cart with ${lines.length} eSIM plan(s) — awaiting payment`,
          paid_at: null,
          receipt_url: null,
        },
      });

      for (const line of lines) {
        await tx.orderItem.create({
          data: {
            transactionId: created.id,
            userId,
            destination: line.destination!.name,
            destinationSlug: line.destination!.slug,
            planId: line.plan!.id,
            planData: line.plan!.data,
            validityDays: line.plan!.validityDays,
            points: line.payPoints,
            priceCents: line.priceCents,
          },
        });
      }

      return created;
    });

    // 2. Create the payment; roll the pending order back on failure
    try {
      const response = await fetch(`${apiUrl}/ctp/api/checkouts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString('base64')}`,
          'X-API-Version': '2',
        },
        body: JSON.stringify({
          checkout: {
            test: testMode,
            transaction_type: 'payment',
            order: {
              amount: totalCents,
              currency: PAYMENT_CURRENCY,
              description,
              // Format matters: the webhook extracts the Clerk id back out of "cart_<clerkId>_<ts>"
              tracking_id,
            },
            customer: { email: customerEmail || 'customer@myfastbird.com' },
            settings: {
              return_url: process.env.SECURE_PROCESSOR_RETURN_URL || 'https://myfastbird.com/payment/success',
              cancel_url: process.env.SECURE_PROCESSOR_CANCEL_URL || 'https://myfastbird.com/payment/cancel',
              notification_url: process.env.SECURE_PROCESSOR_WEBHOOK_URL || 'https://myfastbird.com/api/webhooks/secure-processor',
            },
          },
        }),
      });

      const result = response.ok ? await response.json() : null;
      const redirect_url = result?.checkout?.redirect_url;

      if (!response.ok || !redirect_url) {
        const errorText = result ? JSON.stringify(result) : await response.text();
        console.error('Secure-Processor cart checkout error:', response.status, errorText);
        throw new Error('payment_failed');
      }

      return NextResponse.json({
        success: true,
        redirect_url,
        amount: `€${totalEur.toFixed(2)}`,
      });
    } catch (paymentError) {
      // Best-effort rollback so no dangling pending order stays behind
      await prismadb.orderItem.deleteMany({ where: { transactionId: savedTransaction.id } });
      await prismadb.transaction.delete({ where: { id: savedTransaction.id } }).catch(() => {});
      console.error('[CART_CHECKOUT_PAYMENT_ERROR]', paymentError);
      return NextResponse.json(
        { error: 'Failed to create payment. Please try again.' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('[CART_CHECKOUT_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to start checkout. Please try again.' },
      { status: 500 }
    );
  }
}