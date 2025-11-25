# Secure-ProcessorPay Integration Testing Guide

## Overview

This guide provides step-by-step instructions for testing the Secure-ProcessorPay payment integration end-to-end.

## Prerequisites

1. Environment variables configured (see `SECURE-PROCESSOR_ENV_CONFIGURATION.md`)
2. `SECURE-PROCESSOR_TEST_MODE=true` set in environment
3. Application running locally or deployed to Vercel

## Test Scripts

### 1. Environment Validation

Validate all environment variables are correctly configured:

```bash
node scripts/validate-secure-processor-env.js
```

**Expected Output:**
- ✅ All required variables validated
- ⚠️ Any warnings displayed
- 📝 Instructions for Vercel deployment

### 2. API Integration Test

Test the Secure-ProcessorPay API integration directly:

```bash
node scripts/test-secure-processor-integration.js
```

**What it tests:**
- ✅ API endpoint is correct
- ✅ Authentication works
- ✅ Amount is integer (no floats)
- ✅ Response contains token and redirect_url
- ✅ Multiple currencies (EUR, USD, GBP)

**Expected Output:**
- 3 test cases executed
- All validations passed
- Payment URLs provided for manual testing

## Manual Testing Flows

### Test Flow 1: Successful Payment (End-to-End)

1. **Start Payment Flow**
   - Navigate to dashboard settings: `/dashboard/settings`
   - Click "Buy More" button
   - Enter number of tokens (e.g., 10)
   - Select currency (EUR, USD, or GBP)
   - Check "I agree to Terms" checkbox
   - Click "Buy Tokens"

2. **Verify Redirect**
   - ✅ Should see "Redirecting to payment page..." toast
   - ✅ Should be redirected to Secure-ProcessorPay hosted page
   - ✅ No extra modal or confirmation screen
   - ⏱️ Redirect should happen within 500ms

3. **Complete Payment**
   - Enter test card details:
     ```
     Card: 4200000000000000
     CVV: 123
     Expiry: 12/25
     Name: Test User
     ```
   - Complete 3D Secure (if prompted): `12345`
   - Click "Pay"

4. **Verify Success Page**
   - ✅ Redirected to `/payment/success`
   - ✅ Transaction details displayed
   - ✅ Success message shown
   - ✅ Token count updated (TODO: implement)

5. **Verify Webhook**
   - Check server logs for webhook receipt
   - ✅ Webhook received within 5 seconds
   - ✅ Signature validation passed
   - ✅ Status is "success"

### Test Flow 2: Failed Payment

1. **Start Payment Flow** (same as above)

2. **Use Failed Card**
   ```
   Card: 4000000000000002 (Card declined)
   CVV: 123
   Expiry: 12/25
   ```

3. **Verify Error Handling**
   - ✅ Error message displayed on hosted page
   - ✅ User can retry with different card
   - ✅ User can cancel and return

4. **Check Webhook**
   - ✅ Webhook received with status "failed"
   - ✅ Error message included

### Test Flow 3: Canceled Payment

1. **Start Payment Flow** (same as above)

2. **Cancel Payment**
   - Click "Cancel" or close the hosted payment page
   - Or use browser back button

3. **Verify Cancel Page**
   - ✅ Redirected to `/payment/cancel` (if configured)
   - ✅ Cancel message displayed
   - ✅ Option to retry payment

4. **Check Webhook**
   - ✅ Webhook received with status "canceled"

### Test Flow 4: Network Errors

1. **Simulate Network Timeout**
   - Temporarily disconnect internet during payment
   - Or use browser dev tools to throttle network

2. **Verify Error Handling**
   - ✅ Timeout error displayed
   - ✅ User can retry
   - ✅ No charges made

### Test Flow 5: Idempotency

1. **Make Payment**
   - Complete a successful payment
   - Note the `tracking_id`

2. **Retry Same Payment**
   - Try to make another payment with same `tracking_id`
   - ✅ Should either reject duplicate or handle gracefully

## Test Cards (Sandbox Mode)

### Success Scenarios
```
Card: 4200000000000000
CVV: 123
Expiry: Any future date
3D Secure: 12345
Result: Success
```

### Failure Scenarios

```
Card: 4000000000000002
Result: Card declined

Card: 4000000000000069
Result: Expired card

Card: 4000000000000127
Result: Incorrect CVC

Card: 4000000000000259
Result: Insufficient funds
```

## Automated Test Checklist

### Unit Tests (TODO)

- [ ] Amount calculation
- [ ] Currency conversion
- [ ] Request body formatting
- [ ] Response parsing
- [ ] Error handling

### Integration Tests (TODO)

- [ ] API route handler
- [ ] Webhook handler
- [ ] Signature verification
- [ ] Database updates
- [ ] Email sending

### E2E Tests (TODO)

- [ ] Complete payment flow
- [ ] Failed payment flow
- [ ] Canceled payment flow
- [ ] Webhook receipt
- [ ] Token crediting

## API Testing with cURL

### Create Payment Checkout

```bash
curl -X POST https://checkout.secure-processorpay.com/ctp/api/checkouts \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "X-API-Version: 2" \
  -H "Authorization: Basic $(echo -n '29959:dbfb6f4e...' | base64)" \
  -d '{
    "checkout": {
      "test": true,
      "transaction_type": "payment",
      "order": {
        "amount": 238,
        "currency": "EUR",
        "description": "Test Payment",
        "tracking_id": "test_123"
      },
      "customer": {
        "email": "test@example.com"
      },
      "settings": {
        "return_url": "https://your-domain.vercel.app/payment/success",
        "notification_url": "https://your-domain.vercel.app/api/webhooks/secure-processor"
      }
    }
  }'
```

**Expected Response:**
```json
{
  "checkout": {
    "token": "abc123...",
    "redirect_url": "https://checkout.secure-processorpay.com/widget/hpp.html?token=abc123..."
  }
}
```

### Check Payment Status

```bash
curl -X GET "https://checkout.secure-processorpay.com/ctp/api/checkouts/{token}" \
  -H "Accept: application/json" \
  -H "X-API-Version: 2" \
  -H "Authorization: Basic $(echo -n '29959:dbfb6f4e...' | base64)"
```

## Testing Webhooks Locally

### Using ngrok

1. **Install ngrok**
   ```bash
   brew install ngrok
   ```

2. **Start Local Server**
   ```bash
   npm run dev
   ```

3. **Start ngrok Tunnel**
   ```bash
   ngrok http 3000
   ```

4. **Update Webhook URL**
   - Copy ngrok URL (e.g., `https://abc123.ngrok.io`)
   - Update webhook URL in code to:
     ```typescript
     const notificationUrl = 'https://abc123.ngrok.io/api/webhooks/secure-processor';
     ```

5. **Make Test Payment**
   - Complete payment flow
   - Webhook will be sent to your local server via ngrok

### Manual Webhook Testing

Send a test webhook request:

```bash
curl -X POST http://localhost:3000/api/webhooks/secure-processor \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "txn_123",
    "order_id": "order_123",
    "status": "success",
    "amount": "238",
    "currency": "EUR",
    "type": "payment",
    "customer_email": "test@example.com",
    "signature": "calculated_signature_here"
  }'
```

**Note:** You need to calculate a valid signature for this to work.

## Monitoring & Logging

### What to Monitor

1. **Payment Success Rate**
   - Track successful vs failed payments
   - Alert if success rate drops below 95%

2. **API Response Times**
   - Monitor `/api/payment/secure-processor` response times
   - Alert if P95 > 3 seconds

3. **Webhook Delivery**
   - Track webhook receipt times
   - Alert if webhooks not received within 5 minutes

4. **Error Types**
   - Group errors by type
   - Identify most common failures

### Logging Best Practices

```typescript
// Production logging
console.log({
  timestamp: Date.now(),
  event: 'payment_created',
  tracking_id: 'gen_user_xxx',
  amount: 238,
  currency: 'EUR',
  test_mode: true,
  response_time_ms: 1234,
  status: 'success'
});
```

## Troubleshooting

### Issue: "Payment token creation failed"

**Check:**
1. Environment variables are set correctly
2. API endpoint is `checkout.secure-processorpay.com`
3. Amount is integer (cents)
4. Shop ID and Secret Key are valid

**Debug:**
```bash
# Check environment variables
node scripts/validate-secure-processor-env.js

# Test API directly
node scripts/test-secure-processor-integration.js

# Check server logs
# Look for errors in API route handler
```

### Issue: "Webhook not received"

**Check:**
1. Webhook URL is correct
2. Server is accessible from internet
3. Webhook endpoint returns 200 status

**Debug:**
```bash
# Test webhook endpoint
curl http://localhost:3000/api/webhooks/secure-processor

# Expected response:
# { "message": "Secure-Processor webhook endpoint is active", "timestamp": "..." }
```

### Issue: "Invalid signature"

**Check:**
1. Secret Key is correct
2. Signature algorithm matches documentation
3. Webhook body is not modified

**Debug:**
```typescript
// Add logging to webhook handler
console.log('Received webhook:', body);
console.log('Expected signature:', expectedSignature);
console.log('Actual signature:', signature);
```

## Production Checklist

Before deploying to production:

### Configuration
- [ ] `SECURE-PROCESSOR_TEST_MODE=false` in Vercel
- [ ] Production credentials configured
- [ ] Return URL updated to production domain
- [ ] Webhook URL updated to production domain

### Testing
- [ ] All sandbox tests passed
- [ ] Test with 0.01 EUR real transaction
- [ ] Webhook received in production
- [ ] Success/failure/cancel flows tested
- [ ] Refund flow tested

### Monitoring
- [ ] Error alerting configured
- [ ] Success rate monitoring enabled
- [ ] Webhook delivery monitoring enabled
- [ ] Log aggregation configured

### Documentation
- [ ] README updated
- [ ] Support contacts documented
- [ ] Escalation process defined

## Test Scenarios Matrix

| Scenario | Amount | Currency | Card | Expected Result | Webhook Status |
|----------|--------|----------|------|-----------------|----------------|
| Success | 238 | EUR | 4200...0000 | Success page | success |
| Success | 250 | USD | 4200...0000 | Success page | success |
| Success | 200 | GBP | 4200...0000 | Success page | success |
| Declined | 238 | EUR | 4000...0002 | Error message | failed |
| Expired | 238 | EUR | 4000...0069 | Error message | failed |
| Bad CVC | 238 | EUR | 4000...0127 | Error message | failed |
| No funds | 238 | EUR | 4000...0259 | Error message | failed |
| Cancel | 238 | EUR | 4200...0000 | Cancel page | canceled |

## Next Steps

1. **Run Validation**
   ```bash
   node scripts/validate-secure-processor-env.js
   ```

2. **Run Integration Tests**
   ```bash
   node scripts/test-secure-processor-integration.js
   ```

3. **Manual Testing**
   - Complete at least one successful payment
   - Test one failure scenario
   - Test cancel flow

4. **Deploy to Vercel**
   - Set environment variables
   - Deploy application
   - Test in deployed environment

5. **Production Testing**
   - Test with 0.01 EUR
   - Verify webhook receipt
   - Monitor for 24 hours

---

**Last Updated:** 2025-10-09  
**Testing Status:** ⚠️ Requires manual testing

