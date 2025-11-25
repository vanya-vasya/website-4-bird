# Secure-ProcessorPay Environment Configuration Guide

## Required Environment Variables

### Local Development (.env.local)

Create a `.env.local` file in the project root with the following variables:

```bash
# Secure-ProcessorPay Payment Provider Configuration
# ==========================================

# Shop ID from Secure-ProcessorPay dashboard
SECURE-PROCESSOR_SHOP_ID=29959

# Secret Key from Secure-ProcessorPay dashboard (keep this secret!)
SECURE-PROCESSOR_SECRET_KEY=dbfb6f4e977f49880a6ce3c939f1e7be645a5bb2596c04d9a3a7b32d52378950

# Secure-ProcessorPay API URL (use checkout.secure-processorpay.com - NOT gateway.secure-processorpay.com)
SECURE-PROCESSOR_API_URL=https://checkout.secure-processorpay.com

# Enable test mode (true for sandbox, false for production)
SECURE-PROCESSOR_TEST_MODE=true

# Public-facing widget URL (optional, for reference)
NEXT_PUBLIC_SECURE-PROCESSOR_WIDGET_URL=https://checkout.secure-processorpay.com
```

### Vercel Deployment

Add the following environment variables in Vercel Project Settings > Environment Variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| `SECURE-PROCESSOR_SHOP_ID` | `29959` | Production, Preview, Development |
| `SECURE-PROCESSOR_SECRET_KEY` | `dbfb6f4e977f49880a6ce3c939f1e7be...` | Production, Preview, Development |
| `SECURE-PROCESSOR_API_URL` | `https://checkout.secure-processorpay.com` | Production, Preview, Development |
| `SECURE-PROCESSOR_TEST_MODE` | `true` (for testing) or `false` (for production) | Select appropriate environment |
| `NEXT_PUBLIC_SECURE-PROCESSOR_WIDGET_URL` | `https://checkout.secure-processorpay.com` | Production, Preview, Development |

## Important Configuration Notes

### 1. Amount Format
- **Must be an integer in cents**
- Example: 238 = 2.38 EUR, 250 = 2.50 USD
- ❌ Wrong: `238.0952380952381`
- ✅ Correct: `238`

### 2. API Endpoint
- **Must use the correct endpoint**
- ❌ Wrong: `https://gateway.secure-processorpay.com/ctp/api/checkouts`
- ❌ Wrong: `https://checkout.secure-processorpay.com/api/v1/payment/init`
- ✅ Correct: `https://checkout.secure-processorpay.com/ctp/api/checkouts`

### 3. Authentication
- **Use HTTP Basic authentication**
- Format: `Authorization: Basic ${base64(SHOP_ID:SECRET_KEY)}`
- Headers required:
  - `Content-Type: application/json`
  - `Accept: application/json`
  - `X-API-Version: 2`
  - `Authorization: Basic ...`

### 4. Callback URLs
These are hardcoded in the API route (`app/api/payment/secure-processor/route.ts`):
- Return URL: `https://your-domain.vercel.app/payment/success`
- Webhook URL: `https://your-domain.vercel.app/api/webhooks/secure-processor`

**Update these URLs** to match your Vercel deployment domain.

### 5. Test Mode
- Set `SECURE-PROCESSOR_TEST_MODE=true` for sandbox testing
- Use test cards from Secure-ProcessorPay documentation
- Set `SECURE-PROCESSOR_TEST_MODE=false` for production

## Validation

Run the validation script to check your environment variables:

```bash
node scripts/validate-secure-processor-env.js
```

Expected output if everything is correct:
```
✅ All required environment variables are set and valid!
```

## Testing

Run the integration test to verify the configuration:

```bash
node scripts/test-secure-processor-integration.js
```

This will:
1. Create test payment checkouts
2. Verify API responses
3. Validate amounts, currencies, and URLs
4. Provide payment URLs to complete test transactions

## Common Issues

### Issue 1: "Amount must be integer"
**Cause:** Sending float instead of integer  
**Fix:** The code now uses `Math.round(amount * 100)` to ensure integer

### Issue 2: "404 Not Found"
**Cause:** Wrong endpoint  
**Fix:** Updated to use `/ctp/api/checkouts`

### Issue 3: "Access Denied"
**Cause:** Using wrong API URL (`gateway.secure-processorpay.com`)  
**Fix:** Use `checkout.secure-processorpay.com`

### Issue 4: "Invalid signature" (Webhooks)
**Cause:** Secret key mismatch  
**Fix:** Ensure `SECURE-PROCESSOR_SECRET_KEY` is correct in environment variables

## Security Best Practices

1. ✅ **Never commit** `.env.local` or any file containing secrets to git
2. ✅ **Use Vercel environment variables** for production secrets
3. ✅ **Rotate secrets** periodically
4. ✅ **Use test mode** for development and testing
5. ✅ **Validate webhook signatures** before processing
6. ✅ **Use HTTPS** for all API calls

## Deployment Checklist

Before deploying to production:

- [ ] All environment variables set in Vercel
- [ ] `SECURE-PROCESSOR_TEST_MODE=false` in production
- [ ] Return URL updated to production domain
- [ ] Webhook URL updated to production domain
- [ ] Test with small real amount (0.01 EUR)
- [ ] Verify webhook is received
- [ ] Verify payment success flow
- [ ] Verify payment cancel flow
- [ ] Set up monitoring/alerts

## Support

**Secure-ProcessorPay Support:**
- Email: support@secure-processorpay.com
- Documentation: https://docs.secure-processorpay.com

**Current Configuration Status:**
- ✅ Amount formatting fixed (integer cents)
- ✅ Correct API endpoint configured
- ✅ Direct redirect to payment page
- ✅ Webhook handler implemented
- ✅ Signature verification implemented
- ⏳ Database integration (TODO)
- ⏳ Email notifications (TODO)

---

**Last Updated:** 2025-10-09  
**Validation Status:** ⚠️ Requires environment variable setup

