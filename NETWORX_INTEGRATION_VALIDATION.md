# NetworxPay Integration - Complete Validation & Configuration

## ✅ ISSUES FIXED (2025-10-09)

### 1. Amount Format Issue
**Problem:** Amount was being sent as float (238.0952380952381) instead of integer
**Fix:** Added `Math.round(amount * 100)` to ensure integer cents
```typescript
const amountInCents = Math.round(amount * 100);
// Example: 2.38 EUR -> 238 cents (integer)
```

### 2. API Endpoint Issue
**Problem:** Wrong endpoint `/api/v1/payment/init`
**Fix:** Corrected to `/ctp/api/checkouts`
```typescript
const networxApiUrl = `${apiUrl}/ctp/api/checkouts`;
```

### 3. User Experience Issue
**Problem:** Showed "Payment token created successfully" modal, required extra click
**Fix:** Direct redirect to payment page after token creation
```typescript
setTimeout(() => {
  window.location.href = paymentUrl;
}, 500);
```

---

## 🔧 CONFIGURATION

### Required Environment Variables

```bash
# NetworxPay Credentials
NETWORX_SHOP_ID=29959
NETWORX_SECRET_KEY=dbfb6f4e977f49880a6ce3c939f1e7be645a5bb2596c04d9a3a7b32d52378950

# API Configuration
NETWORX_API_URL=https://checkout.networxpay.com
NETWORX_TEST_MODE=true  # Set to 'false' for production

# Frontend Widget URL (for reference)
NEXT_PUBLIC_NETWORX_WIDGET_URL=https://checkout.networxpay.com
```

### Deployment URLs (Current Vercel Setup)

```bash
# Return URL (after successful payment)
https://website-3-gesry583g-vladis-projects-8c520e18.vercel.app/payment/success

# Webhook URL (for payment notifications)
https://website-3-gesry583g-vladis-projects-8c520e18.vercel.app/api/webhooks/networx
```

---

## 📋 API REQUEST FORMAT

### Correct Request Structure

```http
POST https://checkout.networxpay.com/ctp/api/checkouts
Content-Type: application/json
Accept: application/json
X-API-Version: 2
Authorization: Basic {base64(SHOP_ID:SECRET_KEY)}
```

### Request Body
```json
{
  "checkout": {
    "test": true,
    "transaction_type": "payment",
    "order": {
      "amount": 238,
      "currency": "EUR",
      "description": "Yum-mi Tokens Purchase (10 Tokens)",
      "tracking_id": "gen_user_30xp5Y3ToRRLm2bYM3hOLapPmbW_1759941636614"
    },
    "customer": {
      "email": "vladimir.serushko@gmail.com"
    },
    "settings": {
      "return_url": "https://website-3-gesry583g-vladis-projects-8c520e18.vercel.app/payment/success",
      "notification_url": "https://website-3-gesry583g-vladis-projects-8c520e18.vercel.app/api/webhooks/networx"
    }
  }
}
```

### Expected Response
```json
{
  "checkout": {
    "token": "15e9c004587bc3f9b8e789041cb502da7679f7a18f6cb7ca7b1b0226a527a8a8",
    "redirect_url": "https://checkout.networxpay.com/widget/hpp.html?token=15e9c004587bc3f9b8e789041cb502da7679f7a18f6cb7ca7b1b0226a527a8a8"
  }
}
```

---

## 🔍 TESTING CHECKLIST

### 1. Sandbox/Test Mode Testing

#### Auth (Payment Creation)
- [ ] Create payment with test card (test mode enabled)
- [ ] Verify amount is integer (no decimal places in cents)
- [ ] Verify correct endpoint is called
- [ ] Verify redirect_url is returned
- [ ] Verify immediate redirect to payment page

#### Capture (Payment Completion)
- [ ] Complete payment on hosted page
- [ ] Verify return to return_url
- [ ] Verify webhook notification received
- [ ] Verify webhook signature validation
- [ ] Verify order status updated

#### Refund
- [ ] Initiate refund via NetworxPay dashboard
- [ ] Verify webhook notification received
- [ ] Verify refund status updated
- [ ] Verify customer notified

#### Cancel
- [ ] Cancel payment on hosted page
- [ ] Verify return to return_url with cancel status
- [ ] Verify webhook notification received
- [ ] Verify order status updated to canceled

### 2. Production Mode Testing

**⚠️ Before Production:**
- [ ] Set `NETWORX_TEST_MODE=false`
- [ ] Verify credentials are production credentials
- [ ] Test with small real amount (e.g., 0.01 EUR)
- [ ] Verify all webhooks are received
- [ ] Test refund flow with real transaction

### 3. Error Handling

#### Success Flow
- [ ] Payment completes successfully
- [ ] User redirected to success page
- [ ] Tokens added to user account
- [ ] Confirmation email sent

#### Failure Flow
- [ ] Card declined
- [ ] Insufficient funds
- [ ] 3D Secure failure
- [ ] User receives error message
- [ ] Can retry payment

#### Network Errors
- [ ] API timeout (simulate with slow network)
- [ ] API returns 4xx error
- [ ] API returns 5xx error
- [ ] User sees appropriate error message

### 4. Idempotency Testing

- [ ] Submit same payment twice with same tracking_id
- [ ] Verify only one charge is created
- [ ] Verify duplicate is handled gracefully

### 5. Currency & Locale Settings

**Supported Currencies:**
- [ ] EUR - 238 cents = 2.38 EUR
- [ ] USD - 250 cents = 2.50 USD
- [ ] GBP - 200 cents = 2.00 GBP

**Test Each Currency:**
- [ ] Create payment in EUR
- [ ] Create payment in USD
- [ ] Create payment in GBP
- [ ] Verify amounts are correct on hosted page
- [ ] Verify amounts in webhooks match

### 6. Timeout & Retry Policies

**Current Implementation:**
- Default fetch timeout (browser default)
- No automatic retry on API failure
- User can retry manually by reopening modal

**Recommended Improvements:**
- [ ] Add request timeout (30 seconds)
- [ ] Add exponential backoff retry (3 attempts)
- [ ] Log all retry attempts
- [ ] Show retry count to user

### 7. Webhook Validation

#### Signature Verification
- [ ] Webhook with valid signature accepted
- [ ] Webhook with invalid signature rejected (403)
- [ ] Webhook with missing signature rejected (400)

#### Status Handling
- [ ] `success` - Payment completed, tokens added
- [ ] `failed` - Payment failed, user notified
- [ ] `pending` - Payment processing, status updated
- [ ] `canceled` - Payment canceled, order closed
- [ ] `refunded` - Refund processed, tokens deducted

#### Webhook Delivery
- [ ] First notification received within 5 seconds
- [ ] Duplicate notifications handled (idempotency)
- [ ] Late notifications handled correctly

---

## 📊 MONITORING & LOGS

### What to Monitor

1. **Success Rate**
   - Track successful payments vs failed
   - Alert if success rate drops below 95%

2. **API Response Times**
   - Track /api/payment/networx response times
   - Alert if P95 > 3 seconds

3. **Webhook Delivery**
   - Track webhook receipt within 5 minutes
   - Alert if webhooks not received

4. **Error Types**
   - Track most common error codes
   - Group by error type for analysis

### Logging Recommendations

```typescript
// Production logging structure
{
  timestamp: Date.now(),
  event: 'payment_created',
  tracking_id: 'gen_user_xxx_xxx',
  amount: 238,
  currency: 'EUR',
  test_mode: true,
  response_time_ms: 1234,
  status: 'success'
}
```

---

## 🐛 COMMON ISSUES & FIXES

### Issue: "Amount must be integer"
**Cause:** Sending float instead of integer
**Fix:** Use `Math.round(amount * 100)`

### Issue: "404 Not Found"
**Cause:** Wrong endpoint
**Fix:** Use `/ctp/api/checkouts` not `/api/v1/payment/init`

### Issue: "Invalid signature"
**Cause:** Webhook signature verification failing
**Fix:** Check SECRET_KEY is correct, verify signature algorithm

### Issue: "Redirect not working"
**Cause:** Using `payment_url` instead of `redirect_url`
**Fix:** Use `redirect_url` from API response

### Issue: "Test mode not working"
**Cause:** `NETWORX_TEST_MODE` env variable not set
**Fix:** Set `NETWORX_TEST_MODE=true` in .env

---

## 🔐 SECURITY CHECKLIST

- [x] API credentials stored in environment variables (not in code)
- [x] Webhook signatures verified before processing
- [x] HTTPS used for all API calls
- [x] Sensitive data not logged in production
- [ ] Rate limiting on payment endpoint (TODO)
- [ ] CSRF protection on payment forms (TODO)
- [x] Input validation on amounts and emails

---

## 📝 TEST CARDS (Sandbox Mode)

### Success Cards
```
Card: 4200000000000000
CVV: 123
Expiry: Any future date
3D Secure: 12345
```

### Failure Cards
```
Card: 4000000000000002 (Card declined)
Card: 4000000000000069 (Expired card)
Card: 4000000000000127 (Incorrect CVC)
```

---

## 🚀 DEPLOYMENT CHECKLIST

### Before Deploying to Production

1. **Environment Variables**
   - [ ] Update `NETWORX_TEST_MODE=false` on Vercel
   - [ ] Verify production credentials are set
   - [ ] Verify webhook URL is production URL
   - [ ] Verify return URL is production URL

2. **Testing**
   - [ ] Run all sandbox tests
   - [ ] Test with 0.01 EUR real transaction
   - [ ] Verify webhook received in production
   - [ ] Test refund flow

3. **Monitoring**
   - [ ] Set up error alerting
   - [ ] Set up success rate monitoring
   - [ ] Set up webhook delivery monitoring
   - [ ] Configure log aggregation

4. **Documentation**
   - [ ] Update README with production setup
   - [ ] Document support contact (support@networxpay.com)
   - [ ] Document escalation process
   - [ ] Update architecture diagrams

---

## 📞 SUPPORT

**NetworxPay Support:**
- Email: support@networxpay.com
- Documentation: https://docs.networxpay.com

**Current Implementation Status:**
- ✅ Payment creation (fixed)
- ✅ Hosted payment page redirect (fixed)
- ✅ Webhook handling (implemented)
- ✅ Signature verification (implemented)
- ⏳ Token crediting (TODO - connect to database)
- ⏳ Email notifications (TODO - implement)
- ⏳ Refund flow (TODO - test in production)

---

## 🔄 NEXT STEPS

1. **Immediate (Today)**
   - [x] Fix amount formatting
   - [x] Fix API endpoint
   - [x] Fix redirect flow
   - [ ] Test in sandbox mode

2. **Short-term (This Week)**
   - [ ] Connect webhook to database (credit tokens)
   - [ ] Implement email notifications
   - [ ] Add error monitoring
   - [ ] Test all payment flows

3. **Medium-term (Next Sprint)**
   - [ ] Add retry logic
   - [ ] Implement refund UI
   - [ ] Add payment history page
   - [ ] Improve error messages

4. **Long-term (Future)**
   - [ ] Support more payment methods
   - [ ] Add payment analytics dashboard
   - [ ] Implement subscription payments
   - [ ] Add invoice generation

---

**Last Updated:** 2025-10-09
**Validation Status:** ⚠️ Sandbox Testing Required

