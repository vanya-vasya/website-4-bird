# Quick Test & Debug Guide: Missing Test Transactions

**⏱️ 5-Minute Checklist**

---

## 🚨 Quick Diagnostic Commands

```bash
# 1. Check if webhook endpoint is live
curl https://www.yum-mi.com/api/webhooks/secure-processor

# Expected: {"message":"Secure-Processor webhook endpoint is active","timestamp":"2025-10-14T..."}
# If 404 or error: deployment issue or wrong URL

# 2. Monitor logs in real-time
vercel logs --follow | grep "WEBHOOK"

# 3. Run diagnostic script
DATABASE_URL="postgresql://..." node scripts/diagnose-test-transactions.js

# 4. Check database for transactions
npx prisma studio
# Navigate to Transaction table
```

---

## 🎯 Most Likely Issues (80% of cases)

### Issue #1: Networks Not Sending Webhooks
**Check:** Login to Networks dashboard → Webhooks section  
**Verify:** URL is `https://www.yum-mi.com/api/webhooks/secure-processor`  
**Fix:** Update webhook URL in Networks dashboard  

### Issue #2: User Doesn't Exist in Database
**Check:** Sign in BEFORE making payment  
**Verify:** User appears in Prisma Studio → User table  
**Fix:** Navigate to /dashboard first (triggers user creation)  

### Issue #3: Looking at Wrong Database
**Check:** `DATABASE_URL` from Vercel matches Neon Console endpoint  
**Verify:** `vercel env pull .env.local && cat .env.local | grep DATABASE_URL`  
**Fix:** Find correct Neon project/branch matching the endpoint ID  

---

## 📋 Test Transaction Checklist

- [ ] Webhook endpoint is accessible (curl test passes)
- [ ] User is signed in and exists in database
- [ ] Monitoring Vercel logs (`vercel logs --follow`)
- [ ] Networks dashboard shows webhook URL is configured
- [ ] Test payment triggered with test card: 4200 0000 0000 0000
- [ ] Webhook received (see log: "📥 Secure-Processor HPP Webhook Received")
- [ ] [WEBHOOK-ENV] logged (shows environment and test mode)
- [ ] [WEBHOOK-DATA] logged (shows payment details)
- [ ] User found (no "❌ User not found" error)
- [ ] [WEBHOOK-DB-WRITE] logged (confirms DB write)
- [ ] Transaction visible in Neon Console
- [ ] Transaction visible in Payment History UI

---

## 🔍 Log Patterns to Search For

```bash
# Webhook received
vercel logs | grep "Secure-Processor HPP Webhook Received"

# Environment info
vercel logs | grep "WEBHOOK-ENV"

# Payment data
vercel logs | grep "WEBHOOK-DATA"

# Database write confirmation
vercel logs | grep "WEBHOOK-DB-WRITE"

# Errors
vercel logs | grep "❌"

# User not found
vercel logs | grep "User not found"

# Description format error
vercel logs | grep "Cannot extract token count"
```

---

## 🛠️ Quick Fixes

### Fix 1: User Not Found
```bash
# Create user manually via Prisma
npx prisma studio
# User table → Add Record → Fill in clerkId, email, etc.
```

### Fix 2: Wrong Database URL
```bash
# Get current DATABASE_URL
vercel env pull .env.local
cat .env.local | grep DATABASE_URL

# Copy the endpoint ID (ep-abc123)
# Go to Neon Console and find matching project
```

### Fix 3: Networks Webhook Not Configured
1. Networks Dashboard → API Settings or Webhooks
2. Set webhook URL: `https://www.yum-mi.com/api/webhooks/secure-processor`
3. Enable webhooks for test transactions
4. Save and test

---

## 🧪 Manual Webhook Test

```bash
# Test webhook with curl
curl -X POST https://www.yum-mi.com/api/webhooks/secure-processor \
  -H "Content-Type: application/json" \
  -d '{
    "checkout": {
      "token": "test_token_123",
      "status": "completed",
      "order": {
        "tracking_id": "YOUR_CLERK_USER_ID",
        "amount": 2380,
        "currency": "USD",
        "description": "Payment for 100 Tokens (100 Tokens)"
      },
      "customer": {
        "email": "test@example.com"
      },
      "transaction": {
        "type": "payment",
        "payment_method_type": "credit_card",
        "message": "Payment successful",
        "paid_at": "2025-10-14T10:00:00Z"
      }
    }
  }'

# Expected: {"status":"ok"}
# Check Vercel logs for processing details
```

---

## 📞 Get Help

If issue persists after checklist:

1. **Run diagnostic:** `node scripts/diagnose-test-transactions.js`
2. **Collect logs:** `vercel logs > logs.txt`
3. **Check Networks dashboard** for webhook delivery logs
4. **Verify DATABASE_URL** matches Neon Console
5. **Share evidence:** logs.txt + Networks screenshots + DATABASE_URL (masked)

---

## 🎓 Understanding the Flow

```
User Completes Payment
         ↓
Networks Processes Payment
         ↓
Networks Sends Webhook to: https://www.yum-mi.com/api/webhooks/secure-processor
         ↓
Webhook Handler Receives POST Request
         ↓
Validates Status (must be "completed" or "success")
         ↓
Finds User in Database (by clerkId = tracking_id)
         ↓
Extracts Token Count from Description
         ↓
Updates User Balance
         ↓
Saves Transaction to Database ← **This is where it should appear**
         ↓
Sends Receipt Email
         ↓
Returns 200 OK to Networks
```

**If transaction missing:** One of the steps above failed. Check logs for which step.

---

**Quick Reference:** See `TEST_TRANSACTION_INVESTIGATION_REPORT.md` for full details

