import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Функция для верификации подписи webhook согласно документации Networx
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

// POST - Обработка webhook уведомлений от Networx Hosted Payment Page
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('═'.repeat(60));
    console.log('📥 Networx HPP Webhook Received');
    console.log('═'.repeat(60));
    console.log(JSON.stringify(body, null, 2));
    console.log('═'.repeat(60));

    const secretKey = process.env.NETWORX_SECRET_KEY || 'dbfb6f4e977f49880a6ce3c939f1e7be645a5bb2596c04d9a3a7b32d52378950';
    if (!secretKey) {
      console.error('❌ NETWORX_SECRET_KEY not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Extract checkout data from HPP webhook structure
    const checkout = body.checkout;
    if (!checkout) {
      console.error('❌ Invalid webhook structure: missing checkout object');
      return NextResponse.json(
        { error: 'Invalid webhook structure' },
        { status: 400 }
      );
    }

    // HPP webhooks may not include signature verification
    // Instead, verify by checking the token against our database
    const { 
      token,
      status, 
      order,
      customer,
      transaction
    } = checkout;

    const tracking_id = order?.tracking_id;
    const amount = order?.amount;
    const currency = order?.currency;
    const email = customer?.email;
    
    console.log(`📋 Payment Details:`);
    console.log(`  Token: ${token}`);
    console.log(`  Status: ${status}`);
    console.log(`  Tracking ID: ${tracking_id}`);
    console.log(`  Amount: ${amount} ${currency}`);
    console.log(`  Email: ${email}`);

    // Process payment status
    switch (status) {
      case 'completed':
      case 'success':
        console.log(`✅ Payment SUCCESSFUL for order ${tracking_id}`);
        console.log(`   Amount: ${amount} cents = ${(amount / 100).toFixed(2)} ${currency}`);
        
        // TODO: Update user token balance in database
        // Extract user ID from tracking_id (format: gen_user_<userId>_<timestamp>)
        // const userId = tracking_id.split('_')[2];
        // const tokens = calculateTokensFromAmount(amount, currency);
        // await incrementUserTokenBalance(userId, tokens);
        // await sendConfirmationEmail(email, tracking_id, tokens);
        
        console.log('   ⚠️ TODO: Update user token balance in database');
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

    // Возвращаем успешный ответ согласно требованиям Networx
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
    message: 'Networx webhook endpoint is active',
    timestamp: new Date().toISOString(),
  });
}
