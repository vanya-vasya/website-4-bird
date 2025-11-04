#!/usr/bin/env node

/**
 * Secure-Processor Payment API Test Script
 * 
 * This script tests the Secure-Processor payment integration end-to-end
 * 
 * Usage:
 *   node scripts/test-secure-processor-payment.js
 */

const https = require('https');

// Configuration
const API_URL = 'https://checkout.networxpay.com/ctp/api/checkouts';
const SHOP_ID = process.env.SECURE_PROCESSOR_SHOP_ID || '29959';
const SECRET_KEY = process.env.SECURE_PROCESSOR_SECRET_KEY || 'dbfb6f4e977f49880a6ce3c939f1e7be645a5bb2596c04d9a3a7b32d52378950';
const TEST_MODE = true;

// Test data
const testPayload = {
  checkout: {
    test: TEST_MODE,
    transaction_type: "payment",
    order: {
      amount: 238, // 2.38 EUR in cents
      currency: "EUR",
      description: "Test Payment - Yum-mi Tokens (10 Tokens)",
      tracking_id: `test_${Date.now()}`
    },
    customer: {
      email: "test@example.com"
    },
    settings: {
      return_url: "https://website-3-gesry583g-vladis-projects-8c520e18.vercel.app/payment/success",
      notification_url: "https://website-3-gesry583g-vladis-projects-8c520e18.vercel.app/api/webhooks/secure-processor"
    }
  }
};

// Create Basic Auth header
const auth = Buffer.from(`${SHOP_ID}:${SECRET_KEY}`).toString('base64');

console.log('\n🧪 Secure-Processor Payment API Test');
console.log('═'.repeat(60));
console.log(`Mode: ${TEST_MODE ? '🧪 SANDBOX' : '💳 PRODUCTION'}`);
console.log(`Endpoint: ${API_URL}`);
console.log(`Shop ID: ${SHOP_ID}`);
console.log(`Auth: ${auth.substring(0, 20)}...`);
console.log('═'.repeat(60));

console.log('\n📤 Request Payload:');
console.log(JSON.stringify(testPayload, null, 2));
console.log('\n' + '─'.repeat(60));

// Parse URL
const url = new URL(API_URL);

// Request options
const options = {
  hostname: url.hostname,
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Basic ${auth}`,
    'X-API-Version': '2',
  }
};

console.log('\n📋 Request Headers:');
console.log(JSON.stringify(options.headers, null, 2));
console.log('\n' + '─'.repeat(60));

console.log('\n⏳ Sending request...\n');

// Make request
const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('─'.repeat(60));
    console.log(`📥 Response Status: ${res.statusCode}`);
    console.log('─'.repeat(60));

    try {
      const response = JSON.parse(data);
      console.log('\n📥 Response Body:');
      console.log(JSON.stringify(response, null, 2));
      console.log('\n' + '─'.repeat(60));

      // Validate response
      if (res.statusCode === 200 || res.statusCode === 201) {
        if (response.checkout && response.checkout.token && response.checkout.redirect_url) {
          console.log('\n✅ SUCCESS!');
          console.log('═'.repeat(60));
          console.log(`Token: ${response.checkout.token}`);
          console.log(`Redirect URL: ${response.checkout.redirect_url}`);
          console.log('═'.repeat(60));
          
          console.log('\n📋 Test Results:');
          console.log('  ✅ Amount format: INTEGER (238)');
          console.log('  ✅ Endpoint: CORRECT');
          console.log('  ✅ Response structure: VALID');
          console.log('  ✅ Token received: YES');
          console.log('  ✅ Redirect URL received: YES');
          
          console.log('\n🎯 Next Steps:');
          console.log('  1. Open the redirect URL in browser');
          console.log('  2. Complete payment with test card');
          console.log('  3. Verify webhook delivery');
          console.log('  4. Check token balance update');
          
          console.log('\n🔗 Payment Page:');
          console.log(`  ${response.checkout.redirect_url}`);
          
          process.exit(0);
        } else {
          console.log('\n❌ ERROR: Invalid response structure');
          console.log('Expected: checkout.token and checkout.redirect_url');
          process.exit(1);
        }
      } else {
        console.log('\n❌ ERROR: Request failed');
        console.log(`Status: ${res.statusCode}`);
        console.log('Response:', response);
        process.exit(1);
      }
    } catch (error) {
      console.log('\n❌ ERROR: Failed to parse response');
      console.log('Raw response:', data);
      console.log('Error:', error.message);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.log('\n❌ ERROR: Request failed');
  console.log(error.message);
  process.exit(1);
});

// Send request
req.write(JSON.stringify(testPayload));
req.end();

