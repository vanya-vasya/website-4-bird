#!/usr/bin/env node

/**
 * Manual Webhook Testing Script
 * 
 * Simulates a Networx webhook POST request to test database write functionality
 * 
 * Usage:
 *   node scripts/test-webhook-manually.js [userId] [amount] [tokens]
 * 
 * Examples:
 *   node scripts/test-webhook-manually.js user_2abc123 2380 100
 *   node scripts/test-webhook-manually.js user_test 4760 200
 */

const fetch = require('node-fetch');

// Parse command line arguments
const args = process.argv.slice(2);
const userId = args[0] || 'user_test_123';
const amount = parseInt(args[1]) || 2380; // 23.80 EUR in cents
const tokens = parseInt(args[2]) || 100;
const currency = args[3] || 'EUR';

// Configuration
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:3000/api/webhooks/networx';

// Create mock webhook payload
const webhookPayload = {
  checkout: {
    token: `test_token_${Date.now()}`,
    status: 'completed',
    order: {
      tracking_id: userId,
      amount: amount,
      currency: currency,
      description: `Payment for ${tokens} Tokens (${tokens} Tokens)`,
    },
    customer: {
      email: 'test@example.com',
    },
    transaction: {
      type: 'payment',
      payment_method_type: 'credit_card',
      message: 'Payment successful',
      paid_at: new Date().toISOString(),
      receipt_url: 'https://networxpay.com/receipt/test123',
    },
  },
};

console.log('═'.repeat(60));
console.log('🧪 Manual Webhook Test');
console.log('═'.repeat(60));
console.log('Target URL:', WEBHOOK_URL);
console.log('User ID:', userId);
console.log('Amount:', `${amount} cents = ${(amount / 100).toFixed(2)} ${currency}`);
console.log('Tokens:', tokens);
console.log('═'.repeat(60));
console.log('\nSending webhook...\n');

// Send webhook request
fetch(WEBHOOK_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(webhookPayload),
})
  .then(response => {
    console.log('Response Status:', response.status, response.statusText);
    return response.json();
  })
  .then(data => {
    console.log('\nResponse Body:');
    console.log(JSON.stringify(data, null, 2));
    console.log('\n═'.repeat(60));
    
    if (data.status === 'ok') {
      console.log('✅ Webhook processed successfully!');
      console.log('\nNext steps:');
      console.log('1. Check server logs for transaction processing details');
      console.log('2. Verify database record:');
      console.log(`   SELECT * FROM "Transaction" WHERE "userId" = '${userId}' ORDER BY "paid_at" DESC LIMIT 1;`);
      console.log('3. Check user balance:');
      console.log(`   SELECT "availableGenerations", "usedGenerations" FROM "User" WHERE "clerkId" = '${userId}';`);
      console.log('4. View in Payment History:');
      console.log('   http://localhost:3000/dashboard/billing/payment-history');
    } else if (data.error) {
      console.log(`❌ Webhook failed: ${data.error}`);
    }
    console.log('═'.repeat(60));
  })
  .catch(error => {
    console.error('❌ Request failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('- Is the server running? (npm run dev)');
    console.log('- Is the webhook URL correct?');
    console.log('- Check server logs for errors');
    console.log('═'.repeat(60));
    process.exit(1);
  });

