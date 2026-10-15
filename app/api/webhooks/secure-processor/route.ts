import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prismadb from '@/lib/prismadb';
import { transporter } from '@/config/nodemailer';
import { generatePdfReceipt } from '@/lib/receiptGeneration';
import { company } from '@/constants/company';
import { buildEsimInstallEmail } from '@/lib/esim-install-email';
import { getDestination, getPlan } from '@/constants/destinations';
import { formatEurFromPoints, TOKEN_RATE } from '@/constants/pricing';
import { discountedPoints } from '@/constants/promo';

// Fulfil a cart order (tracking_id "cart_<clerkId>_<ts>"). The line items
// were persisted as pending OrderItems at /api/esim/cart-checkout — on payment
// success mark the order completed, create one eSIM Activity per item and
// email the installation instructions for each plan.
async function handleCartOrder(payload: {
  tracking_id: string;
  amount: number;
  currency: string;
  email: string;
  description: string;
}) {
  const { tracking_id, amount, currency, email } = payload;

  // userId: "cart_user_ABC_123456" → "user_ABC"
  const parts = tracking_id.replace('cart_', '').split('_');
  parts.pop(); // timestamp
  const userId = parts.join('_');

  // The order was written at checkout — fulfil from the database
  const order = await prismadb.transaction.findFirst({
    where: { tracking_id },
    orderBy: { createdAt: 'desc' },
  });

  if (!order) {
    console.error(`❌ Cart order not found in DB: ${tracking_id}`);
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (['completed', 'success', 'successful'].includes(order.status || '')) {
    console.log(`   ⚠️ Cart order already fulfilled: ${order.id}`);
    return NextResponse.json({ status: 'ok' }, { status: 200 });
  }

  const items = await prismadb.orderItem.findMany({
    where: { transactionId: order.id },
    orderBy: { createdAt: 'asc' },
  });

  if (items.length === 0) {
    console.error(`❌ Cart order ${order.id} has no line items`);
    return NextResponse.json({ error: 'Order has no items' }, { status: 400 });
  }

  // Find the user (relink by email after a Clerk instance rotation)
  let user = await prismadb.user.findUnique({ where: { clerkId: userId } });
  if (!user && email) {
    const userByEmail = await prismadb.user.findUnique({ where: { email } });
    if (userByEmail) {
      user = await prismadb.user.update({
        where: { email },
        data: { clerkId: userId },
      });
      console.log(`   🔗 Relinked existing account ${email} to new clerkId ${userId}`);
    }
  }
  if (!user) {
    if (!email) {
      console.error(`❌ Cart order: user not found and webhook has no email`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    user = await prismadb.user.create({
      data: { clerkId: userId, email, photo: '', availableGenerations: 0, usedGenerations: 0 },
    });
    console.log(`   🆕 Provisioned missing user ${userId} (${email}) from cart webhook`);
  }

  const buyerEmail = user.email || email;

  // Mark the order paid and create one Activity per paid eSIM — atomically
  await prismadb.$transaction(async (tx) => {
    await tx.transaction.update({
      where: { id: order.id },
      data: {
        status: 'completed',
        amount: amount,
        currency: currency || order.currency || 'EUR',
        paid_at: new Date(),
        message: `${items.length} eSIM plan(s) delivered — instructions emailed`,
      },
    });

    for (const item of items) {
      await tx.activity.create({
        data: {
          userId,
          destination: item.destination,
          destinationSlug: item.destinationSlug,
          planData: item.planData,
          validityDays: item.validityDays,
          points: item.points,
          transactionId: order.id,
        },
      });
    }
  });

  console.log(`   ✅ Cart order completed: ${items.length} plan(s), ${((amount || 0) / 100).toFixed(2)} EUR by ${userId} (tx ${order.id})`);

  // One installation email per plan, each with its own receipt. The QR lives
  // in public/ which is CDN-served but not bundled into the serverless
  // function, so it must be fetched over HTTP.
  let qrPng: Buffer | null = null;
  try {
    const qrResponse = await fetch('https://myfastbird.com/esim/install-qr.png');
    if (qrResponse.ok) {
      qrPng = Buffer.from(await qrResponse.arrayBuffer());
    } else {
      console.error(`⚠️ QR code fetch returned ${qrResponse.status}, sending emails without inline QR`);
    }
  } catch (qrError) {
    console.error('⚠️ Failed to fetch QR code image:', qrError);
  }

  for (let index = 0; index < items.length; index++) {
    const item = items[index];
    try {
      const receiptId = `${order.id.slice(-8)}${String(index + 1).padStart(2, '0')}`;
      const itemLabel = `${item.destination} ${item.planData} / ${item.validityDays} days`;

      const pdfBuffer = await generatePdfReceipt(
        receiptId,
        buyerEmail,
        new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'numeric', year: 'numeric' }),
        item.points,
        `FastBird eSIM — ${itemLabel}`,
        item.priceCents,
        'EUR'
      );

      await transporter.sendMail(
        buildEsimInstallEmail({
          to: buyerEmail,
          from: process.env.OUTBOX_EMAIL as string,
          orderId: `${order.id}-${index + 1}`,
          receiptId,
          receiptPdf: pdfBuffer,
          qrPng,
          size: item.planData,
          validity: `${item.validityDays} DAY`,
        })
      );
      console.log(`   ✅ eSIM installation email sent for ${itemLabel} to ${buyerEmail}`);
    } catch (emailError) {
      // The payment itself succeeded — log and continue with the next item
      console.error(`   ⚠️ Failed to send the eSIM email for item ${item.id}:`, emailError);
    }
  }

  return NextResponse.json({ status: 'ok' }, { status: 200 });
}

// Fulfil a direct eSIM order (tracking_id "esim_<clerkId>_<ts>"). Instead of
// crediting a balance, the paid plan is recorded as an eSIM purchase and the
// installation email with the QR code is sent — this is the direct-sale flow.
async function handleEsimOrder(payload: {
  tracking_id: string;
  amount: number;
  currency: string;
  email: string;
  description: string;
  status: string;
  receiptTransactionType?: string;
}) {
  const { tracking_id, amount, currency, email, description, status } = payload;

  // userId: "esim_user_ABC_123456" → "user_ABC" (same trick as the gen_ flow)
  const parts = tracking_id.replace('esim_', '').split('_');
  parts.pop(); // timestamp
  const userId = parts.join('_');

  // Plan + promo come back from the description:
  // "FastBird eSIM — <slug> <planId> [PROMOX] (<N> EUR)"
  const match = description.match(
    /^FastBird eSIM — ([a-z0-9-]+) ([a-z0-9-]+)(?: PROMO(\d+))? \(([\d.]+) EUR\)/i
  );
  if (!match) {
    console.error(`❌ Cannot parse eSIM order from description: ${description}`);
    return NextResponse.json({ error: 'Invalid order format' }, { status: 400 });
  }
  const [, destinationSlug, planId, promoPercentRaw] = match;
  const promoPercent = promoPercentRaw ? parseInt(promoPercentRaw, 10) : 0;

  const destination = getDestination(destinationSlug);
  const plan = destination ? getPlan(destination, planId) : undefined;
  if (!destination || !plan) {
    console.error(`❌ Unknown eSIM plan in webhook: ${destinationSlug} ${planId}`);
    return NextResponse.json({ error: 'Unknown plan' }, { status: 400 });
  }

  // Check for duplicate transaction (idempotency)
  const existingTransaction = await prismadb.transaction.findFirst({
    where: {
      tracking_id: tracking_id,
      userId: userId,
      status: { in: ['completed', 'success', 'successful'] },
    },
  });
  if (existingTransaction) {
    console.log(`   ⚠️ eSIM order already fulfilled: ${existingTransaction.id}`);
    return NextResponse.json({ status: 'ok' }, { status: 200 });
  }

  // Find the user (relink by email after a Clerk instance rotation)
  let user = await prismadb.user.findUnique({ where: { clerkId: userId } });
  if (!user && email) {
    const userByEmail = await prismadb.user.findUnique({ where: { email } });
    if (userByEmail) {
      user = await prismadb.user.update({
        where: { email },
        data: { clerkId: userId },
      });
      console.log(`   🔗 Relinked existing account ${email} to new clerkId ${userId}`);
    }
  }
  if (!user) {
    if (!email) {
      console.error(`❌ eSIM order: user not found and webhook has no email`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    user = await prismadb.user.create({
      data: { clerkId: userId, email, photo: '', availableGenerations: 0, usedGenerations: 0 },
    });
    console.log(`   🆕 Provisioned missing user ${userId} (${email}) from eSIM webhook`);
  }

  const buyerEmail = user.email || email;
  const payPoints = discountedPoints(plan.points, promoPercent);
  const planLabel = `${destination.name} ${plan.data} / ${plan.validityDays} days`;

  // Record the transaction and the purchased eSIM atomically
  const savedTransaction = await prismadb.$transaction(async (tx) => {
    const created = await tx.transaction.create({
      data: {
        tracking_id: tracking_id,
        userId,
        status: status,
        amount: amount,
        currency: currency,
        description: `${description}${promoPercent ? ` — promo −${promoPercent}%` : ''}`,
        type: 'esim_purchase',
        payment_method_type: 'card',
        message: `${formatEurFromPoints(payPoints)} EUR paid — eSIM delivered, instructions emailed`,
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
        points: payPoints,
        transactionId: created.id,
      },
    });

    return created;
  });

  console.log(`   ✅ eSIM order recorded: ${planLabel} for ${formatEurFromPoints(payPoints)} EUR by ${userId} (tx ${savedTransaction.id})`);

  // Receipt + installation email. The QR lives in public/ which is CDN-served
  // but not bundled into the serverless function, so it must be fetched over HTTP.
  try {
    const receiptId = savedTransaction.id.slice(-8);

    const pdfBuffer = await generatePdfReceipt(
      receiptId,
      buyerEmail,
      new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'numeric', year: 'numeric' }),
      payPoints,
      `FastBird eSIM — ${planLabel}${promoPercent ? ` — promo −${promoPercent}%` : ''}`,
      Math.round(payPoints * TOKEN_RATE * 100),
      'EUR'
    );

    let qrPng: Buffer | null = null;
    try {
      const qrResponse = await fetch('https://myfastbird.com/esim/install-qr.png');
      if (qrResponse.ok) {
        qrPng = Buffer.from(await qrResponse.arrayBuffer());
      } else {
        console.error(`⚠️ QR code fetch returned ${qrResponse.status}, sending email without inline QR`);
      }
    } catch (qrError) {
      console.error('⚠️ Failed to fetch QR code image:', qrError);
    }

    await transporter.sendMail(
      buildEsimInstallEmail({
        to: buyerEmail,
        from: process.env.OUTBOX_EMAIL as string,
        orderId: savedTransaction.id,
        receiptId,
        receiptPdf: pdfBuffer,
        qrPng,
        size: plan.data,
        validity: `${plan.validityDays} DAY`,
      })
    );
    console.log(`   ✅ eSIM installation email sent to ${buyerEmail}`);
  } catch (emailError) {
    // The payment itself succeeded — don't fail the webhook over a mail error
    console.error('   ⚠️ Failed to send the eSIM installation email:', emailError);
  }

  return NextResponse.json({ status: 'ok' }, { status: 200 });
}

// Функция для верификации подписи webhook согласно документации Secure-Processor
function verifyWebhookSignature(data: Record<string, any>, signature: string, secretKey: string): boolean {
  // Удаляем подпись из данных для верификации
  const { signature: _, ...dataForSignature } = data;

  // Сортируем параметры по ключу
  const sortedParams = Object.keys(dataForSignature)
    .sort()
    .reduce((obj: Record<string, any>, key) => {
      obj[key] = dataForSignature[key];
      return obj;
    }, {});

  // Создаем строку для подписи
  const signString = Object.entries(sortedParams)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  // Создаем подпись HMAC SHA256
  const expectedSignature = crypto
    .createHmac('sha256', secretKey)
    .update(signString)
    .digest('hex');

  return expectedSignature === signature;
}

// POST - Обработка webhook уведомлений от Secure-Processor Hosted Payment Page
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('═'.repeat(60));
    console.log('📥 Secure-Processor HPP Webhook Received');
    console.log('═'.repeat(60));
    console.log(JSON.stringify(body, null, 2));
    console.log('═'.repeat(60));

    // Structured logging for environment tracking
    console.log('🔍 [WEBHOOK-ENV]', JSON.stringify({
      environment: process.env.NODE_ENV || 'development',
      testMode: process.env.SECURE_PROCESSOR_TEST_MODE || 'not set',
      databaseType: process.env.DATABASE_URL?.includes('neon.tech') ? 'Neon Production' : 
                    process.env.DATABASE_URL?.includes('localhost') ? 'Local PostgreSQL' :
                    process.env.DATABASE_URL?.startsWith('file:') ? 'SQLite' : 'Unknown',
      timestamp: new Date().toISOString(),
    }, null, 2));

    const secretKey = process.env.SECURE_PROCESSOR_SECRET_KEY;
    if (!secretKey) {
      console.error('❌ SECURE_PROCESSOR_SECRET_KEY not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Secure-Processor sends webhooks in two possible formats:
    // Format 1 (Direct API): { "transaction": {...} }
    // Format 2 (HPP): { "checkout": {...} }
    
    let tracking_id, amount, currency, email, status, transaction, token, description;
    
    if (body.transaction) {
      // Format 1: Direct transaction webhook
      console.log('📋 Webhook Format: Direct Transaction API');
      transaction = body.transaction;
      tracking_id = transaction.tracking_id;
      amount = transaction.amount;
      currency = transaction.currency;
      email = transaction.customer?.email;
      status = transaction.status; // "successful" not "completed"
      description = transaction.description;
      token = transaction.uid || transaction.id;
    } else if (body.checkout) {
      // Format 2: Hosted Payment Page (HPP) webhook
      console.log('📋 Webhook Format: Hosted Payment Page (HPP)');
      const checkout = body.checkout;
      token = checkout.token;
      status = checkout.status;
      tracking_id = checkout.order?.tracking_id;
      amount = checkout.order?.amount;
      currency = checkout.order?.currency;
      email = checkout.customer?.email;
      description = checkout.order?.description;
      transaction = checkout.transaction;
    } else {
      console.error('❌ Invalid webhook structure: missing transaction or checkout object');
      return NextResponse.json(
        { error: 'Invalid webhook structure' },
        { status: 400 }
      );
    }
    
    console.log(`📋 Payment Details:`);
    console.log(`  Token: ${token}`);
    console.log(`  Status: ${status}`);
    console.log(`  Tracking ID: ${tracking_id}`);
    console.log(`  Amount: ${amount} ${currency}`);
    console.log(`  Email: ${email}`);

    // Structured logging for webhook data tracking
    console.log('🔍 [WEBHOOK-DATA]', JSON.stringify({
      tracking_id: tracking_id,
      amount: amount,
      currency: currency,
      status: status,
      description: description,
      testFlag: body.transaction?.test || body.checkout?.test,
      email: email,
      transactionType: transaction?.type,
      timestamp: new Date().toISOString(),
    }, null, 2));

    // Process payment status
    switch (status) {
      case 'completed':
      case 'success':
      case 'successful': // Secure-Processor uses "successful" not "completed"
        console.log(`✅ Payment SUCCESSFUL for order ${tracking_id}`);
        console.log(`   Amount: ${amount} cents = ${(amount / 100).toFixed(2)} ${currency}`);

        // Direct eSIM sale: fulfil the plan order instead of crediting a balance
        if (typeof tracking_id === 'string' && tracking_id.startsWith('esim_')) {
          return await handleEsimOrder({
            tracking_id,
            amount,
            currency: currency || 'EUR',
            email,
            description: description || '',
            status: 'completed',
          });
        }

        // Cart order: fulfil the persisted pending order and its line items
        if (typeof tracking_id === 'string' && tracking_id.startsWith('cart_')) {
          return await handleCartOrder({
            tracking_id,
            amount,
            currency: currency || 'EUR',
            email,
            description: description || '',
          });
        }
        
        // Save transaction to database
        try {
          // Extract userId (clerkId) from tracking_id
          // tracking_id format: "gen_user_344EICxxMgU6nNDHbBdUskRUPOG_1760465466306"
          // clerkId format: "user_344EICxxMgU6nNDHbBdUskRUPOG"
          let userId = tracking_id;
          
          // If tracking_id starts with "gen_user_", extract the clerkId
          if (tracking_id.startsWith('gen_user_')) {
            // Remove "gen_" prefix and timestamp suffix
            const parts = tracking_id.replace('gen_', '').split('_');
            // Remove last part (timestamp) and rejoin
            parts.pop();
            userId = parts.join('_');
            console.log(`   🔄 Converted tracking_id to userId: ${tracking_id} → ${userId}`);
          }
          
          // Check for duplicate transaction (idempotency)
          const existingTransaction = await prismadb.transaction.findFirst({
            where: {
              tracking_id: tracking_id,
              userId: userId,
              status: { in: ['completed', 'success', 'successful'] },
            },
          });

          if (existingTransaction) {
            console.log(`   ⚠️ Transaction already exists: ${existingTransaction.id}`);
            console.log(`   ℹ️ Webhook retry detected - returning success without duplicate write`);
            return NextResponse.json({ status: 'ok' }, { status: 200 });
          }
          
          // Find user to update token balance
          let user = await prismadb.user.findUnique({
            where: { clerkId: userId },
            select: {
              usedGenerations: true,
              availableGenerations: true,
              email: true,
            },
          });

          // Self-healing: after a Clerk instance rotation the same person gets a new
          // clerkId while the DB row still holds the old one — relink the account by
          // email so balance and history are preserved
          if (!user && email) {
            const userByEmail = await prismadb.user.findUnique({
              where: { email },
              select: {
                usedGenerations: true,
                availableGenerations: true,
                email: true,
              },
            });

            if (userByEmail) {
              await prismadb.user.update({
                where: { email },
                data: { clerkId: userId },
              });
              console.log(`   🔗 Relinked existing account ${email} to new clerkId ${userId}`);
              user = userByEmail;
            } else {
              await prismadb.user.create({
                data: {
                  clerkId: userId,
                  email,
                  photo: '',
                  availableGenerations: 0,
                  usedGenerations: 0,
                },
              });
              console.log(`   🆕 Provisioned missing user ${userId} (${email}) from payment webhook`);
              user = { usedGenerations: 0, availableGenerations: 0, email };
            }
          }

          if (!user) {
            console.error(`❌ User not found and webhook has no email: ${userId}`);
            return NextResponse.json(
              { error: 'User not found' },
              { status: 404 }
            );
          }

          // Extract the credited amount from the description. Current format is
          // "FastBird Top-up (N EUR)" — credited Points are N × 5. Legacy
          // "(N Tokens)" descriptions still credit N directly.
          const desc = description || '';
          const eurMatch = desc.match(/\(([\d.]+)\s+EUR\)/i);
          const legacyTokenMatch = !eurMatch && desc.match(/\((\d+)\s+Tokens\)/i);

          if (!eurMatch && !legacyTokenMatch) {
            console.error(`❌ Cannot extract amount from description: ${desc}`);
            return NextResponse.json(
              { error: 'Invalid description format' },
              { status: 400 }
            );
          }

          const tokens = eurMatch
            ? Math.round(parseFloat(eurMatch[1]) * 5)
            : parseInt(legacyTokenMatch![1]);
          console.log(`   📝 Extracted tokens: ${tokens}`);

          // Update user token balance
          await prismadb.user.update({
            where: { clerkId: userId },
            data: {
              availableGenerations: user.availableGenerations - user.usedGenerations + tokens,
              usedGenerations: 0,
            },
          });
          console.log(`   ✅ Updated user balance: +${tokens} tokens`);

          // Save transaction to database
          const transactionData = {
            tracking_id: tracking_id,
            userId: userId,
            status: status,
            amount: amount,
            currency: currency,
            description: desc,
            type: transaction?.type || 'payment',
            payment_method_type: transaction?.payment_method_type || 'credit_card',
            message: transaction?.message || 'Payment successful',
            paid_at: transaction?.paid_at ? new Date(transaction.paid_at) : new Date(),
            receipt_url: transaction?.receipt_url || body.transaction?.receipt_url || null,
          };

          const savedTransaction = await prismadb.transaction.create({
            data: transactionData,
          });
          console.log(`   ✅ Transaction saved to database: ${savedTransaction.id}`);

          // Structured logging for database write confirmation
          console.log('🔍 [WEBHOOK-DB-WRITE]', JSON.stringify({
            transactionId: savedTransaction.id,
            userId: userId,
            amount: amount,
            currency: currency,
            tokens: tokens,
            status: status,
            databaseType: process.env.DATABASE_URL?.includes('neon.tech') ? 'Neon Production' : 'Other',
            timestamp: new Date().toISOString(),
          }, null, 2));

          // Legacy top-up stream (no longer reachable from the UI, kept so any
          // in-flight orders still settle): send the receipt + thank-you email.
          try {
            const transactionId = token?.slice(-8) || savedTransaction.id.slice(-8);
            const pdfBuffer = await generatePdfReceipt(
              transactionId,
              email,
              new Date().toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'numeric',
                year: 'numeric',
              }),
              tokens,
              description,
              amount,
              currency
            );

            await transporter.sendMail({
              from: process.env.OUTBOX_EMAIL,
              to: email,
              subject: `Receipt #${transactionId} - FastBird Top-up`,
              text: `Hi there,

We're excited to welcome you to FastBird — thanks so much for your recent order on myfastbird.com!

You'll find your transaction receipt attached to this message. Be sure to keep it in case you need it later.

If you run into any issues, have questions about your balance or usage, or need guidance, our support team is just an email away at ${company.email}. We're always ready to help.

With appreciation,
The FastBird Team
myfastbird.com
${company.email}

${company.name}
${company.identification}
${company.address}`,
              attachments: [
                {
                  filename: `receipt-${transactionId}.pdf`,
                  content: pdfBuffer,
                  contentType: 'application/pdf',
                },
              ],
            });
            console.log(`   ✅ Receipt email sent to ${email}`);
          } catch (emailError) {
            console.error('   ⚠️ Failed to send receipt email:', emailError);
            // Don't fail the webhook if email fails
          }

        } catch (dbError) {
          console.error('   ❌ Database error:', dbError);
          return NextResponse.json(
            { error: 'Database error' },
            { status: 500 }
          );
        }
        break;

      case 'failed':
      case 'declined':
        console.log(`❌ Payment FAILED for order ${tracking_id}`);
        console.log(`   Reason: ${transaction?.error_message || 'Unknown'}`);
        // TODO: Notify user of payment failure
        break;

      case 'pending':
      case 'processing':
        console.log(`⏳ Payment PENDING for order ${tracking_id}`);
        // Payment is being processed, wait for final status
        break;

      case 'canceled':
      case 'cancelled':
        console.log(`🚫 Payment CANCELED for order ${tracking_id}`);
        // User canceled the payment
        break;

      case 'refunded':
        console.log(`💰 Payment REFUNDED for order ${tracking_id}`);
        // TODO: Deduct tokens from user balance
        break;

      default:
        console.log(`❓ Unknown payment status: ${status} for order ${tracking_id}`);
    }

    // Возвращаем успешный ответ согласно требованиям Secure-Processor
    return NextResponse.json({ status: 'ok' }, { status: 200 });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// GET - Для проверки доступности endpoint'а
export async function GET() {
  return NextResponse.json({
    message: 'Secure-Processor webhook endpoint is active',
    timestamp: new Date().toISOString(),
  });
}
