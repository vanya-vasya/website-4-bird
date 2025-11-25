# Quick Fix Verification - Token Deduction Bug

**Date**: 2025-10-14  
**Status**: ✅ Fixed

---

## 🚀 Quick Test (5 Minutes)

### 1. Check Initial Balance

```bash
# Use your test user ID
USER_ID="user_344EICxxMgU6nNDHbBdUskRUPOG"

# Connect to database
psql $DATABASE_URL -c "
SELECT 
  'clerkId' as field, \"clerkId\" as value FROM \"User\" 
  WHERE \"clerkId\" = '$USER_ID'
UNION ALL
SELECT 
  'usedGenerations', \"usedGenerations\"::text FROM \"User\" 
  WHERE \"clerkId\" = '$USER_ID'
UNION ALL
SELECT 
  'availableGenerations', \"availableGenerations\"::text FROM \"User\" 
  WHERE \"clerkId\" = '$USER_ID'
UNION ALL
SELECT 
  'remainingCredits', 
  (\"availableGenerations\" - \"usedGenerations\")::text FROM \"User\" 
  WHERE \"clerkId\" = '$USER_ID';
"
```

**Example Output**:
```
       field          |           value
---------------------+---------------------------
 clerkId             | user_344EICxxMgU6nNDHbBdUskRUPOG
 usedGenerations     | 0
 availableGenerations| 40
 remainingCredits    | 40
```

### 2. Use AI Feature

1. Go to https://yum-mi.com/dashboard/conversation?toolId=master-chef
2. Upload any food image
3. Click "Generate" (costs 10 tokens)
4. Wait for AI response

### 3. Verify Deduction (Within 1 Minute)

```bash
# Check updated balance
psql $DATABASE_URL -c "
SELECT 
  \"usedGenerations\" as used,
  \"availableGenerations\" as available,
  (\"availableGenerations\" - \"usedGenerations\") as remaining
FROM \"User\" 
WHERE \"clerkId\" = '$USER_ID';
"
```

**Expected Output**:
```
 used | available | remaining
------+-----------+-----------
   10 |        40 |        30
```

✅ **PASS** if `used` increased by 10  
❌ **FAIL** if `used` is still 0

### 4. Check Transaction Record

```bash
# View last transaction
psql $DATABASE_URL -c "
SELECT 
  LEFT(\"id\", 8) as id,
  \"tracking_id\",
  \"amount\",
  \"type\",
  \"description\",
  \"paid_at\"
FROM \"Transaction\"
WHERE \"userId\" = '$USER_ID'
ORDER BY \"paid_at\" DESC
LIMIT 1;
"
```

**Expected Output**:
```
    id    |        tracking_id          | amount |   type    |          description           |         paid_at
----------+-----------------------------+--------+-----------+--------------------------------+-------------------------
 cmgqxxxx | usage_master-chef_176046... |    -10 | deduction | Your Own Chef - AI Generation  | 2025-10-14 18:11:31.507
```

✅ **PASS** if transaction exists with negative amount  
❌ **FAIL** if no transaction or positive amount

---

## 📊 One-Line Verification

```bash
# Complete check in one command
USER_ID="user_344EICxxMgU6nNDHbBdUskRUPOG"
psql $DATABASE_URL -c "
SELECT 
  u.\"clerkId\",
  u.\"usedGenerations\" as tokens_used,
  COUNT(t.id) FILTER (WHERE t.type = 'deduction') as deduction_count,
  COALESCE(SUM(ABS(t.amount)) FILTER (WHERE t.type = 'deduction'), 0) as total_deducted,
  CASE 
    WHEN u.\"usedGenerations\" = COALESCE(SUM(ABS(t.amount)) FILTER (WHERE t.type = 'deduction'), 0) 
    THEN '✅ MATCH' 
    ELSE '❌ MISMATCH' 
  END as status
FROM \"User\" u
LEFT JOIN \"Transaction\" t ON t.\"userId\" = u.\"clerkId\"
WHERE u.\"clerkId\" = '$USER_ID'
GROUP BY u.\"clerkId\", u.\"usedGenerations\";
"
```

**Expected Output**:
```
           clerkId           | tokens_used | deduction_count | total_deducted |  status
-----------------------------+-------------+-----------------+----------------+----------
 user_344EICxxMgU6nNDHbBdUskRUPOG |          10 |               1 |             10 | ✅ MATCH
```

---

## 🔍 Check Logs

**Vercel Dashboard**:

1. Go to https://vercel.com/your-project/logs
2. Search for: `[API_GENERATE]`
3. Look for:

**Success Log**:
```
[API_GENERATE] ✅ Tokens deducted successfully: {
  userId: "user_344EICxxMgU6nNDHbBdUskRUPOG",
  toolId: "master-chef",
  toolPrice: 10,
  remainingCredits: 30
}
```

**Critical Error** (Should NOT appear):
```
[API_GENERATE] ⚠️ Failed to deduct tokens
```

---

## ⚡ Emergency Checks

### Check if ANY tokens are being deducted (all users)

```bash
psql $DATABASE_URL -c "
SELECT COUNT(*) as total_deductions_today
FROM \"Transaction\"
WHERE \"type\" = 'deduction'
  AND \"paid_at\" >= CURRENT_DATE;
"
```

If `total_deductions_today = 0` after users have used AI features → **BUG ACTIVE**

### Find users with balance mismatches

```bash
psql $DATABASE_URL -c "
WITH balances AS (
  SELECT 
    u.\"clerkId\",
    u.\"usedGenerations\" as db_used,
    COALESCE(SUM(ABS(t.amount)) FILTER (WHERE t.type = 'deduction'), 0) as txn_deducted
  FROM \"User\" u
  LEFT JOIN \"Transaction\" t ON t.\"userId\" = u.\"clerkId\"
  GROUP BY u.\"clerkId\", u.\"usedGenerations\"
)
SELECT COUNT(*) as users_with_mismatches
FROM balances
WHERE db_used != txn_deducted;
"
```

If `users_with_mismatches > 0` → **INVESTIGATE**

---

## 🧪 Test Different Tools

```bash
# Test all three AI tools
USER_ID="user_344EICxxMgU6nNDHbBdUskRUPOG"

# After using each tool, run:
psql $DATABASE_URL -c "
SELECT 
  t.\"description\",
  t.\"amount\",
  t.\"paid_at\"
FROM \"Transaction\" t
WHERE t.\"userId\" = '$USER_ID'
  AND t.\"type\" = 'deduction'
ORDER BY t.\"paid_at\" DESC
LIMIT 3;
"
```

**Expected**:
```
              description             | amount |         paid_at
--------------------------------------+--------+-------------------------
 Your Own Tracker - AI Generation     |     -5 | 2025-10-14 18:15:00.000
 Your Own Chef - AI Generation        |    -10 | 2025-10-14 18:12:00.000
 Your Own Nutritionist - AI Generation|    -15 | 2025-10-14 18:10:00.000
```

---

## ✅ Success Checklist

After using AI feature:

- [ ] `usedGenerations` increased by correct amount (5/10/15)
- [ ] Transaction record created with negative amount
- [ ] `type` field = "deduction"
- [ ] `currency` field = "tokens"
- [ ] `tracking_id` starts with "usage_"
- [ ] Logs show "✅ Tokens deducted successfully"
- [ ] Frontend credit display updated
- [ ] Database balance matches transaction history

---

## 🚨 If Something's Wrong

### Symptom: Tokens not deducting

```bash
# 1. Check if API route is deployed
curl -X POST https://yum-mi.com/api/generate \
  -H "Content-Type: application/json" \
  -d '{"tool":{"id":"master-chef"}}'

# Should return 401 (Unauthorized) - means auth is working
# Should NOT return 404 (Not Found) - means route is deployed
```

### Symptom: 403 Forbidden Error

```bash
# User might actually have insufficient credits
psql $DATABASE_URL -c "
SELECT 
  \"usedGenerations\",
  \"availableGenerations\",
  (\"availableGenerations\" - \"usedGenerations\") as remaining
FROM \"User\" 
WHERE \"clerkId\" = '$USER_ID';
"
```

If `remaining < 10` for master-chef → **EXPECTED BEHAVIOR**

### Symptom: Database write failed

```bash
# Check logs for this specific error
vercel logs --filter "[API_GENERATE] ⚠️ Failed to deduct tokens"
```

If found → Manual reconciliation needed (see TESTING_GUIDE.md)

---

## 📞 Contact

Issues? Include:

1. User ID
2. Tool used (master-chef/master-nutritionist/cal-tracker)
3. Timestamp of usage
4. Output of verification queries above
5. Screenshot of error (if any)

---

## 🎯 Quick Reference

| Tool | Cost | Expected Deduction |
|------|------|-------------------|
| Your Own Chef | 10 tokens | `usedGenerations += 10` |
| Your Own Nutritionist | 15 tokens | `usedGenerations += 15` |
| Your Own Tracker | 5 tokens | `usedGenerations += 5` |

**Transaction Record Format**:
```json
{
  "tracking_id": "usage_<toolId>_<timestamp>",
  "amount": -10,  // Negative!
  "currency": "tokens",
  "type": "deduction",
  "status": "completed"
}
```

