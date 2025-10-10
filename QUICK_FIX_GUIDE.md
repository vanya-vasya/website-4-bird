# ⚡ Quick Fix Guide: Payment History Issues

## 🎯 TL;DR - Most Likely Problem

**Your Networx merchant dashboard is configured to redirect to `/dashboard` instead of `/payment/success`.**

This single configuration issue is causing:
- Users don't see success confirmation page
- Users can't find Payment History link (especially on mobile)
- Users see empty history (webhook arrives after redirect)

---

## 🚀 5-Minute Fix

### Step 1: Log into Networx Dashboard
```
URL: https://merchant.networxpay.com
Shop ID: 29959
```

### Step 2: Navigate to HPP Settings
```
Dashboard → Settings → API Configuration → Hosted Payment Page
```

### Step 3: Update These Fields

**Current (Wrong) Configuration:**
```
Success Return URL: https://website-3.../dashboard ❌
```

**Correct Configuration:**
```
Success Return URL: https://website-3-gesry583g-vladis-projects-8c520e18.vercel.app/payment/success ✅
Cancel Return URL:  https://website-3-gesry583g-vladis-projects-8c520e18.vercel.app/payment/cancel ✅
Error Return URL:   https://website-3-gesry583g-vladis-projects-8c520e18.vercel.app/payment/error ✅
```

### Step 4: Save Changes
Click "Save" and wait for confirmation.

### Step 5: Test
1. Go to your app and initiate a test payment
2. Use test card: `4111 1111 1111 1111`
3. Complete payment
4. Verify you're redirected to `/payment/success`
5. Click "View Payment History"
6. Verify transaction appears

✅ **Expected Result**: Payment history visible with transaction entry

---

## 🔍 Verification Commands

### Check Transaction in Database
```bash
# Open Prisma Studio
npx prisma studio

# Or run SQL query
SELECT * FROM "Transaction" 
WHERE status IN ('completed', 'success') 
ORDER BY created_at DESC 
LIMIT 5;
```

### Check Vercel Logs
```bash
# In Vercel Dashboard → Logs, search for:
"Networx HPP Webhook Received"
"Transaction saved to database"
"Payment SUCCESSFUL"
```

### Check Environment Variables
```bash
# Vercel Dashboard → Settings → Environment Variables
# Verify these exist:
NETWORX_SHOP_ID=29959
NETWORX_SECRET_KEY=dbfb6f4e977f49880a6ce3c939f1e7be645a5bb2596c04d9a3a7b32d52378950
NETWORX_API_URL=https://checkout.networxpay.com
DATABASE_URL=postgresql://...
```

---

## 🐛 Still Having Issues?

### Issue: Payment History Link Not Visible

**On Mobile Devices:**
- Open mobile hamburger menu (☰)
- Look for "Payments" link
- Tap to navigate to payment history

**On Desktop:**
- Link should be visible in top navigation bar
- Try hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Clear browser cache and reload

**Check Viewport:**
- Desktop navigation hides at screen width < 1024px
- Use DevTools → Device toolbar to test different sizes

### Issue: Transaction Not Appearing

**Possible Causes:**

1. **Webhook Not Configured**
   - Check Networx dashboard → Webhooks
   - Webhook URL should be: `https://website-3.../api/webhooks/networx`
   - Status should be: ACTIVE ✅

2. **Webhook Timing (Race Condition)**
   - Wait 5-10 seconds after payment
   - Refresh the Payment History page
   - Transaction should appear

3. **Webhook Failed**
   - Check Vercel logs for errors:
     ```
     "Database error"
     "User not found"
     "Cannot extract token count"
     ```
   - If errors found, check database connection and user exists

4. **Test Mode Mismatch**
   - Verify `NETWORX_TEST_MODE` env var matches Networx dashboard
   - Both should be `true` (testing) or `false` (production)

---

## 📊 How to Check What's Happening

### 1. Check Redirect URL (Most Important)
```bash
# During payment, watch browser URL bar:
# After clicking "Pay" on Networx HPP, you should be redirected to:

✅ CORRECT: https://website-3.../payment/success?token=abc123
❌ WRONG:   https://website-3.../dashboard
❌ WRONG:   https://website-3.../dashboard/billing
```

### 2. Check Webhook Logs
```bash
# Vercel Dashboard → Logs → Filter by "webhook"

Expected logs:
[timestamp] 📥 Networx HPP Webhook Received
[timestamp] ✅ Payment SUCCESSFUL for order user_xyz
[timestamp] ✅ Updated user balance: +100 tokens
[timestamp] ✅ Transaction saved to database: txn_abc123
[timestamp] ✅ Receipt email sent to user@example.com

If missing → Webhook not sent or failed
```

### 3. Check Database Directly
```sql
-- Check if transaction exists
SELECT id, tracking_id, status, amount, paid_at 
FROM "Transaction" 
WHERE userId = 'your_clerk_id' 
ORDER BY created_at DESC;

-- Check if user balance was updated
SELECT clerkId, availableGenerations, usedGenerations 
FROM "User" 
WHERE clerkId = 'your_clerk_id';
```

---

## 🎯 Root Cause Flowchart

```
Is redirect URL correct (/payment/success)?
│
├─→ NO → FIX: Update Networx dashboard return URL (Step 1-4 above)
│
└─→ YES
    │
    Is "Payment History" link visible?
    │
    ├─→ NO → Check viewport size / mobile menu / browser cache
    │
    └─→ YES
        │
        Is transaction appearing in Payment History?
        │
        ├─→ NO → Check:
        │        1. Webhook logs (received?)
        │        2. Database (transaction exists?)
        │        3. Wait 10 seconds and refresh
        │
        └─→ YES → ✅ Everything working!
```

---

## 📋 Quick Diagnosis Checklist

Run through this checklist in order:

- [ ] **Login to Networx Dashboard**
- [ ] **Check "Success Return URL" setting**
      - If wrong → Update and save
      - If correct → Continue to next step
- [ ] **Test payment with test card**
      - Observe where browser redirects
      - Expected: `/payment/success`
- [ ] **Check Vercel logs for webhook receipt**
      - Search: "Webhook Received"
      - Check timestamp (should be within 2-5 seconds of payment)
- [ ] **Check database for transaction**
      - Query: `SELECT * FROM "Transaction" ORDER BY created_at DESC LIMIT 1`
      - Should have recent transaction
- [ ] **Navigate to Payment History page**
      - URL: `/dashboard/billing/payment-history`
      - Should see transaction(s)
- [ ] **Verify user balance updated**
      - Check `availableGenerations` increased
      - Check `usedGenerations` reset to 0

**If all checked ✅ → Issue resolved!**

---

## 🔗 Related Documentation

For detailed analysis, see:
- **Root Cause Investigation**: `PAYMENT_REDIRECT_INVESTIGATION.md`
- **Flow Sequence Analysis**: `PAYMENT_FLOW_SEQUENCE_ANALYSIS.md`
- **Complete Solution**: `COMPLETE_PAYMENT_HISTORY_SOLUTION.md`

---

## 🆘 Support

If issue persists after following this guide:

1. Check Vercel logs for specific error messages
2. Verify all environment variables are set correctly
3. Contact Networx support: support@networxpay.com
4. Check Networx documentation: https://docs.networxpay.com

**Log Files to Share**:
- Vercel webhook logs (sanitize sensitive data)
- Database query results (transaction table)
- Browser DevTools console errors
- Screenshot of Networx dashboard settings

---

**Last Updated**: October 10, 2025  
**Status**: Ready for immediate use

