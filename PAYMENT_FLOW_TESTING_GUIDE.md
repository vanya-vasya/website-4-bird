# Payment Flow Testing Guide

## 🧪 Manual Testing Checklist

### Prerequisites:
- [ ] Vercel deployment with webhook URL configured
- [ ] Networx dashboard configured with correct webhook URL
- [ ] Test mode enabled (`NETWORX_TEST_MODE=true`)
- [ ] Valid test user account

---

## Test Scenario 1: Successful Payment Flow ✅

### Steps:
1. **Sign in** to dashboard
   - URL: `https://your-app.vercel.app/dashboard`
   
2. **Open Buy Tokens Modal**
   - Click "Buy Tokens" button
   
3. **Select Token Amount**
   - Enter: `50 tokens`
   - Price should show: `£10.00` (50 × £0.20)
   
4. **Initiate Payment**
   - Click "Buy Tokens"
   - Verify redirect to Networx checkout page
   
5. **Complete Payment**
   - Use test card: `4111 1111 1111 1111`
   - Expiry: Any future date
   - CVV: `123`
   - Click "Pay"
   
6. **Verify Redirect**
   - Should redirect to `/payment/success`
   - Success message displayed
   
7. **Check Payment History**
   - Navigate to `/dashboard/billing/payment-history`
   - **Expected**: Transaction appears in table
   
8. **Verify Transaction Details**
   - ID: Last 12 characters visible
   - Date: Current date/time
   - Amount: `10.00 GBP`
   - Status: `Success`
   - Receipt: Download link visible ✅
   
9. **Test Receipt Download**
   - Click "Download" link
   - **Expected**: PDF downloads with transaction details
   
10. **Verify Token Balance**
    - Check balance in header
    - **Expected**: Increased by 50 tokens

### Expected Logs (Vercel):
```
📥 Networx HPP Webhook Received
✅ Payment SUCCESSFUL for order gen_userId_timestamp
   Extracted userId: user_xxx
   Found user: test@example.com
   Current balance: 20 tokens
   Calculated tokens: 50
   ✅ Updated user balance: 70 tokens
   ✅ Transaction created: txn_xxx
   ✅ Receipt PDF generated and stored
   ✅ Confirmation email sent to test@example.com
```

---

## Test Scenario 2: Failed Payment ❌

### Steps:
1. **Initiate Payment** (steps 1-4 from above)
   
2. **Use Decline Test Card**
   - Card: `4000 0000 0000 0002` (Decline card)
   - Complete form
   - Click "Pay"
   
3. **Verify Error Handling**
   - Payment should fail
   - Error message displayed
   
4. **Check Payment History**
   - Navigate to payment history
   - **Expected**: Failed transaction logged (optional)
   
5. **Verify Token Balance**
   - **Expected**: Balance unchanged

### Expected Logs:
```
❌ Payment FAILED for order gen_userId_timestamp
   Reason: Card declined
   ✅ Failed transaction logged
```

---

## Test Scenario 3: Canceled Payment 🚫

### Steps:
1. **Initiate Payment** (steps 1-4 from Scenario 1)
   
2. **Cancel on Payment Page**
   - Click "Cancel" or close window
   
3. **Verify Behavior**
   - Redirect to cancel page or dashboard
   - **Expected**: No transaction created
   - **Expected**: Balance unchanged

---

## Test Scenario 4: Receipt Verification 📄

### Steps:
1. **Complete Successful Payment** (Scenario 1)
   
2. **Download Receipt**
   - Click "Download" in payment history
   
3. **Verify PDF Content**:
   - [ ] Yum-mi header/logo
   - [ ] "PAYMENT RECEIPT" title
   - [ ] Receipt date
   - [ ] Transaction ID matches
   - [ ] Receipt number present
   - [ ] Payment amount correct
   - [ ] Currency correct
   - [ ] Status shows "Success"
   - [ ] Company information present
   - [ ] "Thank you" message

---

## Test Scenario 5: Email Notification 📧

### Prerequisites:
- `RESEND_API_KEY` configured
- Valid email address

### Steps:
1. **Complete Successful Payment**
   
2. **Check Email Inbox**
   - **Expected**: Confirmation email received
   
3. **Verify Email Content**:
   - [ ] Subject: "Payment Confirmation - X Tokens Added"
   - [ ] Transaction ID visible
   - [ ] Amount displayed correctly
   - [ ] Tokens added shown
   - [ ] Date/time included
   - [ ] PDF receipt attached
   
4. **Open PDF Attachment**
   - **Expected**: Same as downloaded receipt

---

## Test Scenario 6: Multiple Payments 💰

### Steps:
1. **Make First Payment**
   - 10 tokens (£2.00)
   - Complete successfully
   
2. **Make Second Payment**
   - 25 tokens (£5.00)
   - Complete successfully
   
3. **Verify Payment History**
   - **Expected**: Both transactions visible
   - **Expected**: Sorted by date (newest first)
   
4. **Verify Token Balance**
   - **Expected**: Increased by 35 tokens total (10 + 25)

---

## Test Scenario 7: Edge Cases 🔍

### Test 7a: Network Timeout
1. Initiate payment
2. Simulate network disconnect during payment
3. **Expected**: Webhook retried by Networx
4. **Expected**: Transaction eventually processed

### Test 7b: Duplicate Webhook
1. Complete payment
2. Manually trigger webhook again with same tracking_id
3. **Expected**: Duplicate detection (tracking_id unique)
4. **Expected**: Balance not double-credited

### Test 7c: Invalid Tracking ID
1. Send webhook with malformed tracking_id
2. **Expected**: Error logged, no transaction created
3. **Expected**: Webhook returns 200 OK (to prevent retries)

---

## Database Verification Queries

### Check Latest Transactions:
```sql
SELECT 
  id,
  tracking_id,
  status,
  amount,
  currency,
  paid_at,
  receipt_url IS NOT NULL as has_receipt
FROM "Transaction"
ORDER BY paid_at DESC
LIMIT 10;
```

### Check User Balance:
```sql
SELECT 
  clerkId,
  email,
  usedGenerations,
  availableGenerations,
  (availableGenerations - usedGenerations) as current_balance
FROM "User"
WHERE email = 'test@example.com';
```

### Find Missing Receipts:
```sql
SELECT 
  id,
  tracking_id,
  amount,
  currency
FROM "Transaction"
WHERE status = 'success'
AND receipt_url IS NULL;
```

---

## Monitoring Dashboard

### Key Metrics to Track:
1. **Transaction Success Rate**
   ```sql
   SELECT 
     status,
     COUNT(*) as count,
     ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
   FROM "Transaction"
   WHERE paid_at > NOW() - INTERVAL '24 hours'
   GROUP BY status;
   ```

2. **Average Transaction Value**
   ```sql
   SELECT 
     currency,
     AVG(amount) / 100 as avg_amount,
     COUNT(*) as count
   FROM "Transaction"
   WHERE status = 'success'
   AND paid_at > NOW() - INTERVAL '7 days'
   GROUP BY currency;
   ```

3. **Receipt Generation Rate**
   ```sql
   SELECT 
     COUNT(*) as total_success,
     COUNT(receipt_url) as with_receipt,
     ROUND(COUNT(receipt_url) * 100.0 / COUNT(*), 2) as receipt_rate
   FROM "Transaction"
   WHERE status = 'success';
   ```

---

## Troubleshooting

### Issue: Transaction Not Appearing

**Steps**:
1. Check Vercel logs for webhook reception
2. Verify tracking_id format: `gen_userId_timestamp`
3. Check user exists in database
4. Verify webhook URL configured in Networx

**Commands**:
```bash
# View logs
vercel logs --prod --follow

# Filter for specific tracking_id
vercel logs --prod | grep "gen_userId_timestamp"
```

---

### Issue: Receipt Not Downloading

**Steps**:
1. Check transaction status is 'success'
2. Verify receipt_url field populated
3. Check browser console for errors

**Query**:
```sql
SELECT receipt_url IS NOT NULL as has_receipt
FROM "Transaction"
WHERE id = 'txn_xxx';
```

---

### Issue: Balance Not Updated

**Steps**:
1. Verify webhook processed successfully
2. Check calculation: `amount_in_pence / 20 = tokens`
3. Verify user update query succeeded

**Query**:
```sql
-- Check user balance history
SELECT 
  availableGenerations,
  usedGenerations,
  (availableGenerations - usedGenerations) as balance
FROM "User"
WHERE clerkId = 'userId';
```

---

## Performance Testing

### Load Test: Multiple Concurrent Payments

```bash
# Install k6
brew install k6

# Run load test
k6 run payment-load-test.js
```

**Expected**:
- [ ] All payments processed correctly
- [ ] No duplicate transactions
- [ ] All receipts generated
- [ ] Webhook responses < 2 seconds

---

## Security Testing

### Test 1: Unauthorized Access
- **Try**: Access payment history without authentication
- **Expected**: Redirect to sign-in

### Test 2: Other User's Transactions
- **Try**: Access another user's transactions
- **Expected**: Only see own transactions

### Test 3: Invalid Webhook Signature
- **Try**: Send webhook with invalid signature
- **Expected**: Rejected (if signature validation enabled)

---

## Acceptance Criteria ✅

- [ ] Payment flow completes end-to-end
- [ ] Transaction appears in payment history
- [ ] User balance updates correctly
- [ ] Receipt PDF downloads successfully
- [ ] Receipt contains accurate data
- [ ] Confirmation email sent (if configured)
- [ ] Failed payments handled gracefully
- [ ] Logs show detailed debug information
- [ ] No errors in browser console
- [ ] No errors in Vercel logs
- [ ] Database integrity maintained
- [ ] All edge cases handled

---

## Sign-off

**Tested By**: _________________  
**Date**: _________________  
**Environment**: [ ] Staging [ ] Production  
**Result**: [ ] Pass [ ] Fail  

**Notes**:
```
_________________________________________________
_________________________________________________
_________________________________________________
```

---

**Version**: 1.0  
**Last Updated**: October 9, 2025

