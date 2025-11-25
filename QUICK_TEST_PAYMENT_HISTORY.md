# Quick Test Guide: Payment History Fix

**Time Required:** 5 minutes  
**Purpose:** Verify transactions appear in Payment History

---

## 🚀 Quick Test (Local Development)

### Step 1: Start Server
```bash
npm run dev
```

### Step 2: Send Test Webhook
Open new terminal:
```bash
# Replace with your actual Clerk user ID
node scripts/test-webhook-manually.js user_YOUR_CLERK_ID 2380 100
```

Example with real user ID:
```bash
node scripts/test-webhook-manually.js user_2abc123xyz 2380 100
```

### Step 3: Check Database
```bash
npx prisma studio
```
- Navigate to `Transaction` table
- Verify new record exists
- Check `userId`, `amount`, `status`, `paid_at`

### Step 4: View Payment History
Open browser:
```
http://localhost:3000/dashboard/billing/payment-history
```

**Expected Result:** Transaction appears in table

---

## 🧪 Run Integration Tests

```bash
npm test secure-processor-webhook-database-write
```

**Expected:** All 6 tests pass
- ✅ Successful webhook saves to database
- ✅ Transaction appears in Payment History
- ✅ Handles missing user (404)
- ✅ Handles invalid description (400)
- ✅ Handles duplicate webhooks (idempotency)
- ✅ Multiple webhooks process correctly

---

## 🔍 What to Look For

### Server Logs (Terminal)
```
═══════════════════════════════════════════════════════
📥 Secure-Processor HPP Webhook Received
═══════════════════════════════════════════════════════
✅ Payment SUCCESSFUL for order user_2abc123xyz
   📝 Extracted tokens: 100
   ✅ Updated user balance: +100 tokens
   ✅ Transaction saved to database: clxxx...
   ✅ Receipt email sent to test@example.com
```

### Database Record
- `tracking_id`: Matches user ID
- `amount`: 2380 (in cents)
- `currency`: EUR
- `status`: completed or success
- `paid_at`: Current timestamp
- `description`: "Payment for 100 Tokens (100 Tokens)"

### Payment History UI
- Transaction appears in table
- ID shows last 12 characters
- Date formatted correctly
- Amount displays as "23.80 EUR"
- Status shows "Completed"

---

## ❌ Troubleshooting

### Issue: "User not found" Error

**Cause:** Invalid user ID  
**Fix:** Use real Clerk user ID from database

```sql
SELECT "clerkId" FROM "User" LIMIT 1;
```

Then:
```bash
node scripts/test-webhook-manually.js <actual_clerkId> 2380 100
```

---

### Issue: "Invalid description format" Error

**Cause:** Description doesn't match pattern `(X Tokens)`  
**Fix:** Script already uses correct format, no action needed

---

### Issue: Transaction Not Appearing in UI

**Possible Causes:**

1. **Wrong User Logged In**
   - Payment History only shows transactions for current user
   - Ensure webhook `tracking_id` matches logged-in user's `clerkId`

2. **Database Not Updated**
   - Check server logs for errors
   - Verify webhook reached server
   - Check database directly with Prisma Studio

3. **Caching Issue**
   - Hard refresh browser (Cmd+Shift+R on Mac)
   - Check in private/incognito window

---

### Issue: Duplicate Transactions

**Should Not Happen** - Idempotency check prevents this  
**If It Does:**
- Check server logs for idempotency check messages
- Verify tracking_id is unique per payment

---

## 🎯 Success Checklist

- [ ] Server starts without errors
- [ ] Test webhook script runs successfully
- [ ] Server logs show webhook processing
- [ ] Database contains new transaction record
- [ ] User balance increased correctly
- [ ] Transaction visible in Payment History UI
- [ ] All integration tests pass

---

## 📞 Need Help?

1. **Check server logs** - Most issues show error messages
2. **Review root cause doc** - `PAYMENT_HISTORY_ROOT_CAUSE_ANALYSIS.md`
3. **Check webhook payload** - Verify structure matches expected format
4. **Verify environment** - DATABASE_URL, SECURE-PROCESSOR keys configured

---

## 🚀 Ready for Production?

After successful local testing:

1. **Run all tests:** `npm test`
2. **Deploy to Vercel:** `vercel --prod`
3. **Test with real payment:**
   - Use test card: 4200 0000 0000 0000
   - CVV: any 3 digits
   - Date: any future date
4. **Monitor logs:** `vercel logs`
5. **Verify Payment History** on production

---

**Estimated Total Time:** 5-10 minutes  
**Last Updated:** October 10, 2025

