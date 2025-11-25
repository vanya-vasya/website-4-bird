# Token Deduction - Testing & Verification Guide

**Fix Date**: 2025-10-14  
**Issue**: AI feature usage not decrementing tokens in database  
**Status**: Fixed & Ready for Testing

---

## Quick Verification (Manual Testing)

### Step 1: Check Initial Balance

```bash
# Connect to your database
psql $DATABASE_URL

# Check user's current balance
SELECT "clerkId", "usedGenerations", "availableGenerations", 
       ("availableGenerations" - "usedGenerations") as remaining
FROM "User" 
WHERE "clerkId" = 'user_344EICxxMgU6nNDHbBdUskRUPOG';
```

**Expected Output:**
```
 clerkId                          | usedGenerations | availableGenerations | remaining
----------------------------------+-----------------+---------------------+-----------
 user_344EICxxMgU6nNDHbBdUskRUPOG |              0  |                  40 |        40
```

### Step 2: Use AI Feature

1. Login to https://yum-mi.com
2. Navigate to "Your Own Chef" (costs 10 tokens)
3. Upload an image and generate a recipe
4. Wait for AI response

### Step 3: Verify Token Deduction

```sql
-- Check updated balance
SELECT "clerkId", "usedGenerations", "availableGenerations", 
       ("availableGenerations" - "usedGenerations") as remaining
FROM "User" 
WHERE "clerkId" = 'user_344EICxxMgU6nNDHbBdUskRUPOG';
```

**Expected Output:**
```
 clerkId                          | usedGenerations | availableGenerations | remaining
----------------------------------+-----------------+---------------------+-----------
 user_344EICxxMgU6nNDHbBdUskRUPOG |             10  |                  40 |        30
```

**✅ usedGenerations should have increased by 10**

### Step 4: Verify Transaction Record

```sql
-- Check transaction history
SELECT "id", "tracking_id", "userId", "amount", "currency", 
       "description", "type", "message", "paid_at"
FROM "Transaction"
WHERE "userId" = 'user_344EICxxMgU6nNDHbBdUskRUPOG'
ORDER BY "paid_at" DESC
LIMIT 5;
```

**Expected Output:**
```
 id                      | tracking_id                    | userId        | amount | currency | description                      | type      | message                                      | paid_at
-------------------------+--------------------------------+---------------+--------+----------+----------------------------------+-----------+---------------------------------------------+-------------------------
 cmgqxxx...             | usage_master-chef_1760467890123 | user_344...   | -10    | tokens   | Your Own Chef - AI Generation    | deduction | 10 tokens deducted for Your Own Chef        | 2025-10-14 18:11:31.507
```

**✅ A negative transaction record should exist with amount = -10**

---

## Automated Test Suite

### Run Unit Tests

```bash
npm test __tests__/api/generate-token-deduction.test.ts
```

**Expected Output:**
```
PASS  __tests__/api/generate-token-deduction.test.ts
  /api/generate - Token Deduction
    Authentication
      ✓ should reject unauthenticated requests (12ms)
    Credit Balance Check
      ✓ should check credit balance before processing (8ms)
      ✓ should reject requests with insufficient credits (7ms)
      ✓ should allow requests with sufficient credits (10ms)
    Token Deduction
      ✓ should deduct tokens after successful AI generation (15ms)
      ✓ should NOT deduct tokens if AI generation fails (9ms)
      ✓ should handle different tool prices correctly (25ms)
    Transaction Record Creation
      ✓ should create transaction record with correct schema (11ms)
    Atomic Operations
      ✓ should use database transaction for atomic operations (8ms)
    Error Handling
      ✓ should handle database errors gracefully (9ms)
      ✓ should return 404 if user not found in database (7ms)
    Free Tools
      ✓ skip credit checks for free tools (6ms)

Test Suites: 1 passed, 1 total
Tests:       12 passed, 12 total
```

---

## Integration Testing Scenarios

### Scenario 1: Normal Usage Flow

**Action**: User with 40 tokens uses "Your Own Chef" (10 tokens)

**Expected Results**:
- ✅ Request succeeds with 200 status
- ✅ AI response is returned
- ✅ `usedGenerations` increases from 0 → 10
- ✅ Remaining credits decrease from 40 → 30
- ✅ Transaction record created with `amount = -10`
- ✅ Frontend credit display updates to show 30 remaining

### Scenario 2: Insufficient Credits

**Action**: User with 5 tokens attempts "Your Own Chef" (10 tokens required)

**Expected Results**:
- ✅ Request fails with 403 status
- ✅ Error message: "Insufficient credits"
- ✅ `usedGenerations` remains unchanged
- ✅ NO transaction record created
- ✅ Frontend shows error toast

### Scenario 3: Different Tool Prices

**Actions**:
1. Use "Your Own Tracker" (5 tokens)
2. Use "Your Own Chef" (10 tokens)
3. Use "Your Own Nutritionist" (15 tokens)

**Expected Results** (starting with 50 tokens):
```
After Tracker:       usedGenerations = 5,  remaining = 45
After Chef:          usedGenerations = 15, remaining = 35
After Nutritionist:  usedGenerations = 30, remaining = 20
```

### Scenario 4: Concurrent Requests

**Action**: User submits 3 simultaneous requests

**Expected Results**:
- ✅ All requests processed atomically
- ✅ No race conditions
- ✅ Token deductions are accurate
- ✅ 3 separate transaction records created

### Scenario 5: Network Failure During AI Generation

**Action**: N8N webhook times out or fails

**Expected Results**:
- ✅ Request fails with 504 or 502 status
- ✅ `usedGenerations` remains unchanged (NO deduction)
- ✅ NO transaction record created
- ✅ Frontend shows error message

### Scenario 6: Database Failure After AI Generation

**Action**: AI generation succeeds but database write fails

**Expected Results**:
- ⚠️ AI response still returned to user (don't lose their result)
- ⚠️ Error logged for manual reconciliation
- ⚠️ `usedGenerations` may not be updated (manual fix needed)

---

## Database Queries for Verification

### 1. Check User Balance

```sql
SELECT 
  u."clerkId",
  u."email",
  u."usedGenerations",
  u."availableGenerations",
  (u."availableGenerations" - u."usedGenerations") as "remainingCredits"
FROM "User" u
WHERE u."clerkId" = 'YOUR_USER_ID';
```

### 2. Check Transaction History

```sql
SELECT 
  t."id",
  t."tracking_id",
  t."amount",
  t."currency",
  t."description",
  t."type",
  t."status",
  t."paid_at"
FROM "Transaction" t
WHERE t."userId" = 'YOUR_USER_ID'
ORDER BY t."paid_at" DESC
LIMIT 10;
```

### 3. Calculate Token Usage Summary

```sql
SELECT 
  u."clerkId",
  u."email",
  u."availableGenerations" as "total_tokens",
  u."usedGenerations" as "used_tokens",
  (u."availableGenerations" - u."usedGenerations") as "remaining_tokens",
  COUNT(CASE WHEN t."type" = 'payment' THEN 1 END) as "purchases",
  COUNT(CASE WHEN t."type" = 'deduction' THEN 1 END) as "ai_generations",
  COALESCE(SUM(CASE WHEN t."type" = 'payment' THEN t."amount" END), 0) as "total_purchased_tokens",
  COALESCE(SUM(CASE WHEN t."type" = 'deduction' THEN ABS(t."amount") END), 0) as "total_spent_tokens"
FROM "User" u
LEFT JOIN "Transaction" t ON t."userId" = u."clerkId"
WHERE u."clerkId" = 'YOUR_USER_ID'
GROUP BY u."clerkId", u."email", u."availableGenerations", u."usedGenerations";
```

### 4. Audit: Find Users with Mismatched Balances

```sql
-- Find users where transaction history doesn't match balance
WITH user_transactions AS (
  SELECT 
    u."clerkId",
    u."usedGenerations" as db_used,
    COALESCE(SUM(CASE WHEN t."type" = 'deduction' THEN ABS(t."amount") END), 0) as calculated_used
  FROM "User" u
  LEFT JOIN "Transaction" t ON t."userId" = u."clerkId"
  GROUP BY u."clerkId", u."usedGenerations"
)
SELECT 
  "clerkId",
  db_used,
  calculated_used,
  (db_used - calculated_used) as difference
FROM user_transactions
WHERE db_used != calculated_used;
```

---

## Production Monitoring

### 1. Log Monitoring

**Watch for these log patterns:**

```bash
# Successful token deductions
grep "✅ Tokens deducted successfully" /var/log/app.log

# Failed token deductions after successful AI generation (ALERT!)
grep "⚠️ Failed to deduct tokens" /var/log/app.log

# Insufficient credits (expected behavior)
grep "Insufficient credits" /var/log/app.log
```

### 2. Metrics to Track

**Key Performance Indicators:**

- Total AI generations per day
- Token deductions per tool type
- Failed token deductions (should be 0%)
- Average remaining credits per user
- Insufficient credit rejections

**Alerting Thresholds:**

- 🚨 **CRITICAL**: Any occurrence of "Failed to deduct tokens after AI generation"
- ⚠️ **WARNING**: Balance mismatches in audit query > 0 users
- ℹ️ **INFO**: High insufficient credit rejection rate (>20%)

### 3. Database Health Checks

**Run daily:**

```sql
-- Count token deductions today
SELECT COUNT(*) as deductions_today
FROM "Transaction"
WHERE "type" = 'deduction'
  AND "paid_at" >= CURRENT_DATE;
```

**Run weekly:**

```sql
-- Verify transaction integrity
SELECT 
  COUNT(DISTINCT "userId") as active_users,
  COUNT(*) as total_transactions,
  SUM(CASE WHEN "type" = 'payment' THEN 1 ELSE 0 END) as purchases,
  SUM(CASE WHEN "type" = 'deduction' THEN 1 ELSE 0 END) as deductions
FROM "Transaction"
WHERE "paid_at" >= CURRENT_DATE - INTERVAL '7 days';
```

---

## Rollback Plan

If the fix causes issues, rollback to previous version:

```bash
# Revert the fix
git revert HEAD

# Or restore from backup
git checkout production/migrate-to-yum-mi-domain -- app/api/generate/route.ts

# Redeploy
vercel --prod
```

**Note**: Rollback will restore unlimited free usage bug until a better fix is implemented.

---

## Known Edge Cases

### 1. Database Write Failure After AI Generation

**Issue**: AI response returned but tokens not deducted

**Detection**:
```bash
grep "⚠️ Failed to deduct tokens" /var/log/app.log
```

**Manual Fix**:
```sql
-- Find the affected user
-- Manually increment usedGenerations
UPDATE "User"
SET "usedGenerations" = "usedGenerations" + 10
WHERE "clerkId" = 'AFFECTED_USER_ID';

-- Create missing transaction record
INSERT INTO "Transaction" (
  "id", "tracking_id", "userId", "status", "amount", 
  "currency", "description", "type", "message", "paid_at"
) VALUES (
  gen_random_uuid()::text,
  'manual_usage_fix_' || extract(epoch from now())::text,
  'AFFECTED_USER_ID',
  'completed',
  -10,
  'tokens',
  'Manual token deduction - reconciliation',
  'deduction',
  'Manual fix for failed automatic deduction',
  NOW()
);
```

### 2. Concurrent Request Race Condition

**Issue**: Two requests submitted simultaneously might both pass credit check

**Mitigation**: Prisma's atomic `increment` operation prevents double-spending

**Verification**:
```sql
-- Check for any negative balances (shouldn't happen)
SELECT "clerkId", "usedGenerations", "availableGenerations"
FROM "User"
WHERE "usedGenerations" > "availableGenerations";
```

---

## Success Criteria

✅ **Fix is considered successful if:**

1. Token deductions appear in database after AI usage
2. Transaction records are created for all AI generations
3. Frontend credit display matches database balance
4. Insufficient credit checks work correctly
5. No errors in production logs
6. All automated tests pass
7. Database audit queries show no mismatches

---

## Contact & Support

If you encounter issues:

1. Check logs: `/var/log/app.log` or Vercel dashboard
2. Run database audit queries (Section 4.4)
3. Review test results
4. Check GitHub issues for similar problems
5. Contact development team with:
   - User ID affected
   - Timestamp of issue
   - Log excerpts
   - Database query results

