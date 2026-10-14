import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prismadb from '@/lib/prismadb';
import { transporter } from '@/config/nodemailer';
import { generatePdfReceipt } from '@/lib/receiptGeneration';
import { buildEsimInstallEmail } from '@/lib/esim-install-email';
import { getDestination, getPlan } from '@/constants/destinations';
import { formatEurFromPoints, TOKEN_RATE } from '@/constants/pricing';
import { discountedPoints, getPromoDiscount } from '@/constants/promo';

// POST - Buy an eSIM plan with the prepaid balance ("Buy now" button).
// Deducts the plan price from the user's balance and sends the
// eSIM activation email (QR code + manual installation codes).
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { destinationSlug, planId, promoCode } = body as {
      destinationSlug?: string;
      planId?: string;
      promoCode?: string;
    };

    if (!destinationSlug || !planId) {
      return NextResponse.json(
        { error: 'destinationSlug and planId are required' },
        { status: 400 }
      );
    }

    // Plan price is resolved server-side from the catalog — never trust the client
    const destination = getDestination(destinationSlug);
    const plan = destination ? getPlan(destination, planId) : undefined;

    if (!destination || !plan) {
      return NextResponse.json({ error: 'Unknown plan' }, { status: 400 });
    }

    // Promo lookup: absent code = 0%; present but unknown code = error
    const promoPercent =
      typeof promoCode === 'string' && promoCode.trim() !== ''
        ? getPromoDiscount(promoCode)
        : 0;
    if (typeof promoCode === 'string' && promoCode.trim() !== '' && !promoPercent) {
      return NextResponse.json(
        { error: 'Invalid promo code' },
        { status: 400 }
      );
    }

    const pointsCost = discountedPoints(plan.points, promoPercent);

    const user = await prismadb.user.findUnique({
      where: { clerkId: userId },
      select: {
        email: true,
        usedGenerations: true,
        availableGenerations: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const remainingPoints = user.availableGenerations - user.usedGenerations;

    if (remainingPoints < pointsCost) {
      return NextResponse.json(
        {
          error: `Insufficient balance. You need ${formatEurFromPoints(pointsCost)} EUR for this plan but only have ${formatEurFromPoints(remainingPoints)} EUR available.`,
          required: pointsCost,
          available: remainingPoints,
        },
        { status: 402 }
      );
    }

    const planLabel = `${destination.name} ${plan.data} / ${plan.validityDays} days`;

    // Deduct points and record the purchase atomically
    const savedTransaction = await prismadb.$transaction(async (tx) => {
      await tx.user.update({
        where: { clerkId: userId },
        data: { usedGenerations: { increment: pointsCost } },
      });

      const createdTransaction = await tx.transaction.create({
        data: {
          tracking_id: `esim_${userId}_${Date.now()}`,
          userId,
          status: 'completed',
          // Balance is denominated in Points; store the EUR equivalent in cents
          // as a negative amount so the Payments page shows the deduction
          amount: -Math.round(pointsCost * TOKEN_RATE * 100),
          currency: 'EUR',
          description: `FastBird eSIM — ${planLabel}${promoPercent ? ` — promo −${promoPercent}%` : ""} (${formatEurFromPoints(pointsCost)} EUR)`,
          type: 'esim_purchase',
          payment_method_type: 'points',
          message: `${formatEurFromPoints(pointsCost)} EUR deducted from balance for eSIM purchase`,
          paid_at: new Date(),
          receipt_url: null,
        },
      });

      // Track the purchased eSIM per user — feeds /dashboard/activity
      await tx.activity.create({
        data: {
          userId,
          destination: destination.name,
          destinationSlug: destination.slug,
          planData: plan.data,
          validityDays: plan.validityDays,
          points: pointsCost,
          transactionId: createdTransaction.id,
        },
      });

      return createdTransaction;
    });

    console.log(
      `✅ eSIM purchased: ${planLabel} for ${formatEurFromPoints(pointsCost)} EUR by ${userId} (tx ${savedTransaction.id})`
    );

    // Send the eSIM activation email (non-blocking for the purchase itself)
    let emailSent = false;
    try {
      const receiptId = savedTransaction.id.slice(-8);

      // Order confirmation PDF priced in EUR (paid from the prepaid balance)
      const pdfBuffer = await generatePdfReceipt(
        receiptId,
        user.email,
        new Date().toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'numeric',
          year: 'numeric',
        }),
        pointsCost,
        `FastBird eSIM — ${planLabel}${promoPercent ? ` — promo −${promoPercent}%` : ""}`,
        Math.round(pointsCost * TOKEN_RATE * 100),
        'EUR'
      );

      // QR lives in public/ which is CDN-served but not bundled into the
      // serverless function, so it has to be fetched over HTTP
      let qrPng: Buffer | null = null;
      try {
        const qrResponse = await fetch('https://myfastbird.com/esim/install-qr.png');
        if (qrResponse.ok) {
          qrPng = Buffer.from(await qrResponse.arrayBuffer());
        } else {
          console.error(`⚠️ QR code fetch returned ${qrResponse.status}, sending email without inline QR`);
        }
      } catch (qrError) {
        console.error('⚠️ Failed to fetch QR code image, sending email without inline QR:', qrError);
      }

      await transporter.sendMail(
        buildEsimInstallEmail({
          to: user.email,
          from: process.env.OUTBOX_EMAIL as string,
          orderId: savedTransaction.id,
          receiptId,
          receiptPdf: pdfBuffer,
          qrPng,
          size: plan.data,
          validity: `${plan.validityDays} DAY`,
        })
      );
      emailSent = true;
      console.log(`✅ eSIM installation email sent to ${user.email}`);
    } catch (emailError) {
      console.error('⚠️ Failed to send eSIM installation email:', emailError);
    }

    return NextResponse.json({
      success: true,
      orderId: savedTransaction.id,
      pointsCost,
      remainingPoints: remainingPoints - pointsCost,
      emailSent,
    });
  } catch (error) {
    console.error('[ESIM_PURCHASE_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to complete purchase' },
      { status: 500 }
    );
  }
}
