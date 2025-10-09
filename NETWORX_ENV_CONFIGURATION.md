# NetworxPay Environment Configuration Guide

## Required Environment Variables

### Local Development (.env.local)

Create a `.env.local` file in the project root with the following variables:

```bash
# NetworxPay Payment Provider Configuration
# ==========================================

# Shop ID from NetworxPay dashboard
NETWORX_SHOP_ID=29959

# Secret Key from NetworxPay dashboard (keep this secret!)
NETWORX_SECRET_KEY=dbfb6f4e977f49880a6ce3c939f1e7be645a5bb2596c04d9a3a7b32d52378950

# NetworxPay API URL (use checkout.networxpay.com - NOT gateway.networxpay.com)
NETWORX_API_URL=https://checkout.networxpay.com

# Enable test mode (true for sandbox, false for production)
NETWORX_TEST_MODE=true

# Public-facing widget URL (optional, for reference)
NEXT_PUBLIC_NETWORX_WIDGET_URL=https://checkout.networxpay.com
```

### Vercel Deployment

Add the following environment variables in Vercel Project Settings > Environment Variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| `NETWORX_SHOP_ID` | `29959` | Production, Preview, Development |
| `NETWORX_SECRET_KEY` | `dbfb6f4e977f49880a6ce3c939f1e7be...` | Production, Preview, Development |
| `NETWORX_API_URL` | `https://checkout.networxpay.com` | Production, Preview, Development |
| `NETWORX_TEST_MODE` | `true` (for testing) or `false` (for production) | Select appropriate environment |
| `NEXT_PUBLIC_NETWORX_WIDGET_URL` | `https://checkout.networxpay.com` | Production, Preview, Development |

## Important Configuration Notes

### 1. Amount Format
- **Must be an integer in cents**
- Example: 238 = 2.38 EUR, 250 = 2.50 USD
- ❌ Wrong: `238.0952380952381`
- ✅ Correct: `238`

### 2. API Endpoint
- **Must use the correct endpoint**
- ❌ Wrong: `https://gateway.networxpay.com/ctp/api/checkouts`
- ❌ Wrong: `https://checkout.networxpay.com/api/v1/payment/init`
- ✅ Correct: `https://checkout.networxpay.com/ctp/api/checkouts`

### 3. Authentication
- **Use HTTP Basic authentication**
- Format: `Authorization: Basic ${base64(SHOP_ID:SECRET_KEY)}`
- Headers required:
  - `Content-Type: application/json`
  - `Accept: application/json`
  - `X-API-Version: 2`
  - `Authorization: Basic ...`

### 4. Callback URLs
These are hardcoded in the API route (`app/api/payment/networx/route.ts`):
- Return URL: `https://your-domain.vercel.app/payment/success`
- Webhook URL: `https://your-domain.vercel.app/api/webhooks/networx`

**Update these URLs** to match your Vercel deployment domain.

### 5. Test Mode
- Set `NETWORX_TEST_MODE=true` for sandbox testing
- Use test cards from NetworxPay documentation
- Set `NETWORX_TEST_MODE=false` for production

## Validation

Run the validation script to check your environment variables:

```bash
node scripts/validate-networx-env.js
```

Expected output if everything is correct:
```
✅ All required environment variables are set and valid!
```

## Testing

Run the integration test to verify the configuration:

```bash
node scripts/test-networx-integration.js
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
**Cause:** Using wrong API URL (`gateway.networxpay.com`)  
**Fix:** Use `checkout.networxpay.com`

### Issue 4: "Invalid signature" (Webhooks)
**Cause:** Secret key mismatch  
**Fix:** Ensure `NETWORX_SECRET_KEY` is correct in environment variables

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
- [ ] `NETWORX_TEST_MODE=false` in production
- [ ] Return URL updated to production domain
- [ ] Webhook URL updated to production domain
- [ ] Test with small real amount (0.01 EUR)
- [ ] Verify webhook is received
- [ ] Verify payment success flow
- [ ] Verify payment cancel flow
- [ ] Set up monitoring/alerts

## Support

**NetworxPay Support:**
- Email: support@networxpay.com
- Documentation: https://docs.networxpay.com

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

