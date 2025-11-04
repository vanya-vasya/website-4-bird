import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Функция для создания подписи согласно документации Secure-Processor
function createSignature(data: Record<string, any>, secretKey: string): string {
  // Сортируем параметры по ключу
  const sortedParams = Object.keys(data)
    .sort()
    .reduce((obj: Record<string, any>, key) => {
      obj[key] = data[key];
      return obj;
    }, {});

  // Создаем строку для подписи
  const signString = Object.entries(sortedParams)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  // Создаем подпись HMAC SHA256
  return crypto
    .createHmac('sha256', secretKey)
    .update(signString)
    .digest('hex');
}

// POST - Создание токена для платежа
export async function POST(request: NextRequest) {
  try {
    console.log('=== Secure-Processor Payment API Called ===');
    const body = await request.json();
    console.log('Request body:', body);
    
    const { amount, currency = 'USD', orderId, description, customerEmail } = body;
    
    if (!amount || !orderId) {
      console.log('Missing required fields:', { amount, orderId });
      return NextResponse.json(
        { error: 'Amount and orderId are required' },
        { status: 400 }
      );
    }

    // Secure-Processor Pay API credentials and configuration
    const shopId = process.env.SECURE_PROCESSOR_SHOP_ID || '29959';
    const secretKey = process.env.SECURE_PROCESSOR_SECRET_KEY || 'dbfb6f4e977f49880a6ce3c939f1e7be645a5bb2596c04d9a3a7b32d52378950';
    // Use checkout.secure-processorpay.com - verified working endpoint
    // Remove /ctp/api/checkouts if it's already in the env variable (avoid duplication)
    let apiUrl = process.env.SECURE_PROCESSOR_API_URL || 'https://checkout.secure-processorpay.com';
    apiUrl = apiUrl.replace(/\/ctp\/api\/checkouts\/?$/, ''); // Strip trailing path if present
    // Force correct URLs (override old env variables)
    // Production URLs using custom domain yum-mi.com
    const returnUrl = 'https://www.yum-mi.com/dashboard';
    const notificationUrl = 'https://www.yum-mi.com/api/webhooks/secure-processor';
    const testMode = process.env.SECURE_PROCESSOR_TEST_MODE === 'true'; // Use test mode based on env variable
    
    console.log('Environment variables:', {
      shopId: shopId ? 'SET' : 'MISSING',
      secretKey: secretKey ? 'SET' : 'MISSING',
      apiUrl,
      testMode
    });
    
    console.log('API Version: 2, Authentication: HTTP Basic, Using Hosted Payment Page');

    // Convert amount to integer (cents/minor units)
    // Amount comes in major units (e.g., 2.38 EUR), we need minor units (238 cents)
    // Round to 2 decimal places first to avoid floating point errors, then convert to cents
    const amountRounded = Math.round(amount * 100) / 100; // Round to 2 decimals: 2.38
    const amountInCents = Math.round(amountRounded * 100); // Convert to cents: 238
    
    // Request structure for Secure-Processor Pay Hosted Payment Page API v2
    const requestData = {
      checkout: {
        test: testMode, // Use test mode from environment variable
        transaction_type: "payment",
        order: {
          amount: amountInCents, // Amount as INTEGER in minor units (cents)
          currency: currency,
          description: description || 'Payment for order',
          tracking_id: orderId
        },
        customer: {
          email: customerEmail || 'test@example.com'
        },
        settings: {
          return_url: returnUrl,
          notification_url: notificationUrl
        }
      }
    };

    console.log('Final request data:', JSON.stringify(requestData, null, 2));
    console.log(`Amount conversion: ${amount} ${currency} -> ${amountRounded} (rounded) -> ${amountInCents} cents`);
    
    // Make API call to Secure-Processor Pay
    // The 'test' parameter in requestData controls sandbox/production mode
    // Secure-ProcessorPay will return a real token, but the transaction will be test/production based on the 'test' flag
    const secureProcessorApiUrl = `${apiUrl}/ctp/api/checkouts`;
    console.log('Making request to:', secureProcessorApiUrl);
    console.log(`Mode: ${testMode ? '🧪 SANDBOX (test cards)' : '💳 PRODUCTION (real cards)'}`);
    console.log('Using Secure-Processor Pay API v2 with correct endpoint');

    try {
      const secureProcessorResponse = await fetch(secureProcessorApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString('base64')}`,
          'X-API-Version': '2',
        },
        body: JSON.stringify(requestData),
      });

      if (!secureProcessorResponse.ok) {
        const errorData = await secureProcessorResponse.text();
        console.error('Secure-Processor API Error Response:', errorData);
        return NextResponse.json(
          { 
            error: 'Failed to create payment token',
            details: `API returned ${secureProcessorResponse.status}: ${errorData}`
          },
          { status: 400 }
        );
      }

      const secureProcessorResult = await secureProcessorResponse.json();
      console.log('Secure-Processor API Success Response:', JSON.stringify(secureProcessorResult, null, 2));

      // Check for successful response with token and redirect_url
      if (secureProcessorResult.checkout && secureProcessorResult.checkout.token && secureProcessorResult.checkout.redirect_url) {
        console.log('✅ Payment checkout created successfully');
        console.log('Token:', secureProcessorResult.checkout.token);
        console.log('Redirect URL:', secureProcessorResult.checkout.redirect_url);
        
        return NextResponse.json({
          success: true,
          token: secureProcessorResult.checkout.token,
          redirect_url: secureProcessorResult.checkout.redirect_url, // Use redirect_url (not payment_url)
          checkout_id: secureProcessorResult.checkout.token,
        });
      } else {
        console.error('❌ Secure-Processor API returned unsuccessful response:', secureProcessorResult);
        return NextResponse.json(
          { 
            error: 'Payment checkout creation failed',
            details: secureProcessorResult.error || secureProcessorResult.message || 'Unknown error'
          },
          { status: 400 }
        );
      }

    } catch (fetchError) {
      console.error('Network error calling Secure-Processor API:', fetchError);
      return NextResponse.json(
        { 
          error: 'Failed to connect to payment gateway',
          details: fetchError instanceof Error ? fetchError.message : 'Network error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Payment creation error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET - Проверка статуса платежа через HPP API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Payment token is required' },
        { status: 400 }
      );
    }

    const shopId = process.env.SECURE_PROCESSOR_SHOP_ID || '29959';
    const secretKey = process.env.SECURE_PROCESSOR_SECRET_KEY || 'dbfb6f4e977f49880a6ce3c939f1e7be645a5bb2596c04d9a3a7b32d52378950';
    const apiUrl = process.env.SECURE_PROCESSOR_API_URL || 'https://checkout.secure-processorpay.com'; // API URL

    // Send request to Secure-Processor HPP API for status check
    const secureProcessorResponse = await fetch(`${apiUrl}/ctp/api/checkouts/${token}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString('base64')}`,
        'X-API-Version': '2',
      },
    });

    const secureProcessorResult = await secureProcessorResponse.json();

    if (!secureProcessorResponse.ok) {
      console.error('Secure-Processor HPP Status API Error:', secureProcessorResult);
      return NextResponse.json(
        { error: 'Failed to check payment status', details: secureProcessorResult },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      status: secureProcessorResult.status,
      transaction: secureProcessorResult,
    });

  } catch (error) {
    console.error('Payment status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
