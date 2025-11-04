import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prismadb from '@/lib/prismadb';
import { transporter } from '@/config/nodemailer';
import { generatePdfReceipt } from '@/lib/receiptGeneration';

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

    const secretKey = process.env.SECURE_PROCESSOR_SECRET_KEY || 'dbfb6f4e977f49880a6ce3c939f1e7be645a5bb2596c04d9a3a7b32d52378950';
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
          const user = await prismadb.user.findUnique({
            where: { clerkId: userId },
            select: {
              usedGenerations: true,
              availableGenerations: true,
              email: true,
            },
          });

          if (!user) {
            console.error(`❌ User not found: ${userId}`);
            return NextResponse.json(
              { error: 'User not found' },
              { status: 404 }
            );
          }

          // Extract token count from description (e.g., "Payment for 100 Tokens (100 Tokens)" or "Yum-mi Tokens Purchase (20 Tokens)")
          const desc = description || '';
          const match = desc.match(/\((\d+)\s+Tokens\)/i);
          
          if (!match) {
            console.error(`❌ Cannot extract token count from description: ${desc}`);
            return NextResponse.json(
              { error: 'Invalid description format' },
              { status: 400 }
            );
          }
          
          const tokens = parseInt(match[1]);
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

          // Generate and send receipt email
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
              subject: `Receipt #${transactionId} - Yum-Mi Tokens Purchase`,
              text: `Hi there,

We're excited to welcome you to Yum-Mi — thanks so much for your recent order on yum-mi.com!

You'll find your transaction receipt attached to this message. Be sure to keep it in case you need it later.

If you run into any issues, have questions about your token usage, or need guidance, our support team is just an email away at support@yum-mi.com. We're always ready to help.

We're honored to be part of your creative journey.

With appreciation,
The Yum-Mi Team
yum-mi.com
support@yum-mi.com`,
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
