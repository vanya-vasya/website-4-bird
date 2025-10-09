#!/usr/bin/env node

/**
 * NetworxPay Integration Test Script
 * 
 * Tests the payment integration end-to-end in sandbox mode
 * Run: node scripts/test-networx-integration.js
 */

const https = require('https');

// Configuration (from environment variables)
const config = {
  shopId: process.env.NETWORX_SHOP_ID || '29959',
  secretKey: process.env.NETWORX_SECRET_KEY || 'dbfb6f4e977f49880a6ce3c939f1e7be645a5bb2596c04d9a3a7b32d52378950',
  apiUrl: process.env.NETWORX_API_URL || 'https://checkout.networxpay.com',
  returnUrl: 'https://website-3-gesry583g-vladis-projects-8c520e18.vercel.app/payment/success',
  notificationUrl: 'https://website-3-gesry583g-vladis-projects-8c520e18.vercel.app/api/webhooks/networx',
  testMode: true
};

// Test data
const testCases = [
  {
    name: 'Small amount payment (EUR)',
    amount: 238, // 2.38 EUR in cents
    currency: 'EUR',
    description: 'Test payment - 10 tokens',
    email: 'test@example.com'
  },
  {
    name: 'Different currency (USD)',
    amount: 250, // 2.50 USD in cents
    currency: 'USD',
    description: 'Test payment - USD',
    email: 'test-usd@example.com'
  },
  {
    name: 'Different currency (GBP)',
    amount: 200, // 2.00 GBP in cents
    currency: 'GBP',
    description: 'Test payment - GBP',
    email: 'test-gbp@example.com'
  }
];

/**
 * Make HTTP request to NetworxPay API
 */
function makeRequest(requestData) {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${config.shopId}:${config.secretKey}`).toString('base64');
    const postData = JSON.stringify(requestData);

    const options = {
      hostname: 'checkout.networxpay.com',
      port: 443,
      path: '/ctp/api/checkouts',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-API-Version': '2',
        'Authorization': `Basic ${auth}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: jsonData
          });
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Run a single test case
 */
async function runTestCase(testCase) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`TEST: ${testCase.name}`);
  console.log('='.repeat(70));

  const trackingId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const requestData = {
    checkout: {
      test: config.testMode,
      transaction_type: "payment",
      order: {
        amount: testCase.amount,
        currency: testCase.currency,
        description: testCase.description,
        tracking_id: trackingId
      },
      customer: {
        email: testCase.email
      },
      settings: {
        return_url: config.returnUrl,
        notification_url: config.notificationUrl
      }
    }
  };

  console.log('\n📤 REQUEST:');
  console.log(`Endpoint: ${config.apiUrl}/ctp/api/checkouts`);
  console.log(`Method: POST`);
  console.log(`Headers:`);
  console.log(`  Content-Type: application/json`);
  console.log(`  Accept: application/json`);
  console.log(`  X-API-Version: 2`);
  console.log(`  Authorization: Basic ${config.shopId}:***`);
  console.log(`\nBody:`);
  console.log(JSON.stringify(requestData, null, 2));

  try {
    const response = await makeRequest(requestData);

    console.log('\n📥 RESPONSE:');
    console.log(`Status Code: ${response.statusCode}`);
    console.log(`Body:`);
    console.log(JSON.stringify(response.body, null, 2));

    // Validate response
    const validations = [
      {
        name: 'Status Code',
        pass: response.statusCode === 200 || response.statusCode === 201,
        expected: '200 or 201',
        actual: response.statusCode
      },
      {
        name: 'Has checkout object',
        pass: !!response.body.checkout,
        expected: 'true',
        actual: !!response.body.checkout
      },
      {
        name: 'Has token',
        pass: !!response.body.checkout?.token,
        expected: 'string',
        actual: typeof response.body.checkout?.token
      },
      {
        name: 'Has redirect_url',
        pass: !!response.body.checkout?.redirect_url,
        expected: 'string',
        actual: typeof response.body.checkout?.redirect_url
      },
      {
        name: 'redirect_url is valid',
        pass: response.body.checkout?.redirect_url?.startsWith('https://checkout.networxpay.com'),
        expected: 'starts with https://checkout.networxpay.com',
        actual: response.body.checkout?.redirect_url
      },
      {
        name: 'Amount is integer',
        pass: Number.isInteger(testCase.amount),
        expected: 'integer',
        actual: typeof testCase.amount + (Number.isInteger(testCase.amount) ? ' (integer)' : ' (float)')
      }
    ];

    console.log('\n✅ VALIDATIONS:');
    let allPassed = true;
    validations.forEach(v => {
      const status = v.pass ? '✅' : '❌';
      console.log(`${status} ${v.name}: ${v.pass ? 'PASS' : 'FAIL'}`);
      if (!v.pass) {
        console.log(`   Expected: ${v.expected}`);
        console.log(`   Actual: ${v.actual}`);
        allPassed = false;
      }
    });

    if (allPassed) {
      console.log('\n🎉 TEST PASSED!');
      console.log(`\nPayment URL: ${response.body.checkout?.redirect_url}`);
      console.log(`Token: ${response.body.checkout?.token}`);
      console.log(`\n💡 To complete the test, visit the payment URL in a browser.`);
    } else {
      console.log('\n❌ TEST FAILED!');
    }

    return {
      testCase: testCase.name,
      passed: allPassed,
      response: response.body
    };

  } catch (error) {
    console.log('\n❌ ERROR:');
    console.log(error.message);
    console.log(error.stack);

    return {
      testCase: testCase.name,
      passed: false,
      error: error.message
    };
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║         NetworxPay Integration Test Suite                        ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝');
  
  console.log('\n📋 CONFIGURATION:');
  console.log(`Shop ID: ${config.shopId}`);
  console.log(`Secret Key: ${config.secretKey.substring(0, 10)}...`);
  console.log(`API URL: ${config.apiUrl}`);
  console.log(`Test Mode: ${config.testMode}`);
  console.log(`Return URL: ${config.returnUrl}`);
  console.log(`Notification URL: ${config.notificationUrl}`);

  const results = [];

  for (const testCase of testCases) {
    const result = await runTestCase(testCase);
    results.push(result);
    
    // Wait 1 second between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Summary
  console.log('\n\n');
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║                          TEST SUMMARY                             ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`\nTotal Tests: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);

  console.log('\n📊 DETAILED RESULTS:');
  results.forEach((result, index) => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} Test ${index + 1}: ${result.testCase}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('\n✅ Next Steps:');
    console.log('   1. Visit one of the payment URLs above to complete a test transaction');
    console.log('   2. Verify webhook is received at notification URL');
    console.log('   3. Verify return URL works after payment');
    console.log('   4. Check payment status via GET API');
  } else {
    console.log('\n❌ SOME TESTS FAILED!');
    console.log('\n🔍 Debugging Steps:');
    console.log('   1. Check environment variables are set correctly');
    console.log('   2. Verify Shop ID and Secret Key are valid');
    console.log('   3. Check API endpoint is correct');
    console.log('   4. Review request/response logs above');
    console.log('   5. Contact NetworxPay support if issues persist');
  }

  console.log('\n');
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

