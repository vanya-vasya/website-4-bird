# ✅ QUICK DEPLOY CHECKLIST - Clerk Google Sign-In Fix

**Date**: October 14, 2025  
**Issue**: Google OAuth users not created in database  
**Status**: Code fixes applied, ready to deploy

---

## 📦 CHANGES MADE

### 1. Added `createOrGetUser` Function
**File**: `lib/actions/user.actions.ts`
- ✅ Creates user if doesn't exist
- ✅ Returns existing user if found
- ✅ Enhanced logging
- ✅ Proper error handling

### 2. Added Fallback User Creation  
**File**: `lib/api-limit.ts`
- ✅ Auto-creates users on first dashboard load if missing
- ✅ Works for OAuth sign-ins that bypass webhook
- ✅ Applied to `getApiAvailableGenerations()`
- ✅ Applied to `getApiUsedGenerations()`

### 3. Enhanced Webhook Logging
**File**: `app/api/webhooks/clerk/route.ts`
- ✅ Logs all webhook events
- ✅ Returns 500 on DB errors (triggers Clerk retry)
- ✅ Better error messages
- ✅ Tracks event types

### 4. Created Test Script
**File**: `scripts/test-clerk-webhook.js`
- ✅ Tests database user creation
- ✅ Verifies upsert logic
- ✅ Can run locally before deploy

---

## 🚀 DEPLOYMENT STEPS

### Step 1: Run Local Test (Optional)
```bash
cd /Users/vladi/Documents/Projects/webapps/yum-mi
node scripts/test-clerk-webhook.js
```

**Expected Output**:
```
🧪 CLERK WEBHOOK TEST
✅ Connected to database
✅ User created successfully!
✅ User query successful!
✅ ALL TESTS PASSED!
```

---

### Step 2: Commit & Push
```bash
git add -A
git commit -m "Fix: Add user auto-creation fallback for Google OAuth sign-in

- Add createOrGetUser() function with upsert logic
- Add fallback in api-limit.ts to create users if missing
- Enhanced webhook logging for debugging
- Return 500 on DB errors to trigger Clerk retry
- Add test script for verification"

git push origin production/migrate-to-yum-mi-domain
```

---

### Step 3: Wait for Vercel Deploy
```bash
# Monitor deployment:
# https://vercel.com/vladis-projects-8c520e18/website-3/deployments
```

**Wait for**: "✓ Ready" status (1-2 minutes)

---

### Step 4: Verify Webhook Configuration

**Go to Clerk Dashboard**:
```
1. Open: https://dashboard.clerk.com
2. Navigate: Configure → Webhooks
3. Find webhook for: www.yum-mi.com
4. Verify:
   ✅ Endpoint URL: https://www.yum-mi.com/api/webhooks/clerk
   ✅ Events subscribed:
      - user.created
      - user.updated
      - user.deleted
   ✅ Status: Active (green)
   ✅ Signing secret matches WEBHOOK_SECRET in Vercel
```

**If webhook not configured**:
```
1. Click "Add Endpoint"
2. Endpoint URL: https://www.yum-mi.com/api/webhooks/clerk
3. Subscribe to events:
   ☑️ user.created
   ☑️ user.updated
   ☑️ user.deleted
4. Copy signing secret
5. Add to Vercel env vars as WEBHOOK_SECRET
6. Save
```

---

### Step 5: Verify Vercel Environment Variables

**Check these are set**:
```
https://vercel.com → Settings → Environment Variables

Required variables:
✅ DATABASE_URL = postgresql://neondb_owner:...@ep-...c-2...neon.tech/neondb?sslmode=require
✅ WEBHOOK_SECRET = whsec_Evuu+3/9O3LgKvhQQ/AyJc6hIlC2pmUj
✅ CLERK_SECRET_KEY = sk_...
✅ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = pk_...

All variables must be set for:
✅ Production
✅ Preview
✅ Development
```

---

### Step 6: Test Google Sign-In

**Test Flow**:
```
1. Open incognito/private window
2. Go to: https://www.yum-mi.com/sign-in
3. Click "Continue with Google"
4. Select/sign in with Google account
5. Should redirect to: https://www.yum-mi.com/dashboard
6. Dashboard should load WITHOUT errors
7. Token count should display (10 available for new users)
```

---

### Step 7: Verify User Created in Database

**Option A: Using investigate script**:
```bash
cd /Users/vladi/Documents/Projects/webapps/yum-mi
node scripts/investigate-neon-user.js
```

**Expected Output**:
```
✅ Database connected successfully
📊 Found 1 user(s)
   User: test@gmail.com (clerk_xxx...)
```

**Option B: Direct database query**:
```bash
psql 'postgresql://neondb_owner:...@ep-...c-2...neon.tech/neondb?sslmode=require'
```
```sql
SELECT "clerkId", email, "firstName", "lastName", "availableGenerations"
FROM "User"
ORDER BY id DESC
LIMIT 5;
```

---

### Step 8: Check Vercel Logs

**Monitor logs during sign-in**:
```
1. Go to: https://vercel.com/vladis-projects-8c520e18/website-3/logs
2. Click real-time logs
3. Sign in with Google (in another tab)
4. Look for log messages:

Expected logs:
✅ [WEBHOOK] Clerk webhook received
✅ [WEBHOOK] Event type: user.created
✅ [CREATE_USER] Attempting to create user
✅ [CREATE_USER] Success! Created user: clm...

OR (if webhook didn't fire):
✅ [API_LIMIT] User not found in DB, creating via fallback...
✅ [CREATE_OR_GET_USER] Creating new user
✅ [CREATE_OR_GET_USER] Created user: clm...
```

---

## 🎯 SUCCESS CRITERIA

All checkboxes should be ✅:

### Deployment
- [ ] Code pushed to GitHub
- [ ] Vercel shows "✓ Ready"
- [ ] No build errors

### Configuration
- [ ] Webhook configured in Clerk Dashboard
- [ ] Webhook status is "Active"
- [ ] All env vars set in Vercel
- [ ] DATABASE_URL includes `.c-2.` in hostname

### Testing
- [ ] Google sign-in completes successfully
- [ ] Dashboard loads without error
- [ ] Token count displays correctly
- [ ] No "User not found" errors

### Database
- [ ] User exists in database after sign-in
- [ ] User has correct clerkId, email, name
- [ ] User has 10 availableGenerations

### Logs
- [ ] Vercel logs show webhook received OR fallback triggered
- [ ] Vercel logs show user creation success
- [ ] No database connection errors
- [ ] No Prisma errors

---

## 🔍 DEBUGGING IF ISSUES OCCUR

### Issue: Dashboard shows error after sign-in

**Check**:
```
1. Vercel logs for exact error
2. Look for:
   - Database connection errors
   - Prisma query errors
   - [API_LIMIT] or [CREATE_OR_GET_USER] messages
```

**Fix**:
- Verify DATABASE_URL is correct (includes `.c-2.`)
- Check Neon database is active (green in Neon console)
- Wait 5 minutes if Neon was sleeping

---

### Issue: User not in database after sign-in

**Check**:
```
1. Clerk Dashboard → Webhooks → Logs
   - Did webhook fire?
   - Status code? (200 = success, 500 = error)
   
2. Vercel Logs
   - Search for: "WEBHOOK" or "CREATE_USER"
   - Any errors?

3. Vercel Environment Variables
   - Is WEBHOOK_SECRET set?
   - Does it match Clerk signing secret?
```

**Fix**:
- If webhook didn't fire: Check webhook URL in Clerk
- If webhook fired but failed: Check Vercel logs for error
- If no webhook at all: Fallback should still create user

---

### Issue: Webhook fires but user not created

**Check Vercel logs for**:
```
[CREATE_USER] FAILED: ...
```

**Common causes**:
1. Database connection timeout
   - Fix: Wait for Neon to wake up (30 seconds)
   
2. Unique constraint violation (P2002)
   - Fix: Code should handle this now, returns existing user
   
3. Missing required fields
   - Fix: Check Clerk provides email, name, photo
```

---

## 📊 MONITORING COMMANDS

**Test database connection**:
```bash
node scripts/investigate-neon-user.js
```

**Test webhook simulation**:
```bash
node scripts/test-clerk-webhook.js
```

**Check latest deployment**:
```bash
# If you have Vercel CLI:
vercel ls
vercel logs
```

**Check database directly**:
```bash
psql 'postgresql://neondb_owner:npg_ePTqtkSN7G3W@ep-sweet-waterfall-adkazkpm-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require'
```
```sql
-- Count users
SELECT COUNT(*) FROM "User";

-- Show recent users
SELECT "clerkId", email, "createdAt"
FROM "User"
ORDER BY "createdAt" DESC
LIMIT 5;
```

---

## 🆘 EMERGENCY ROLLBACK

**If critical issue occurs after deploy**:
```bash
# Revert to previous commit
git revert HEAD
git push origin production/migrate-to-yum-mi-domain

# Or rollback in Vercel UI:
# https://vercel.com → Deployments → Previous deployment → "Promote to Production"
```

---

## 📝 POST-DEPLOYMENT CHECKLIST

After successful deployment:

- [ ] Test 3 different sign-in methods:
  - [ ] Google OAuth
  - [ ] Email/password (if enabled)
  - [ ] Other OAuth providers (if enabled)

- [ ] Verify all users created successfully:
  ```bash
  node scripts/investigate-neon-user.js
  ```

- [ ] Check Clerk webhook delivery success rate:
  - Clerk Dashboard → Webhooks → Click webhook → Logs tab
  - Should be 100% success (HTTP 200)

- [ ] Monitor Vercel logs for 24 hours:
  - Watch for any [CREATE_USER] FAILED messages
  - Watch for fallback triggers

- [ ] Update documentation:
  - [ ] Mark issue as resolved
  - [ ] Document any remaining edge cases
  - [ ] Update README if needed

---

## ✅ COMPLETION CONFIRMATION

When deployment is successful, you should see:

✅ **In Clerk Dashboard**:
- Webhook deliveries showing 100% success
- No failed deliveries

✅ **In Vercel Logs**:
- `[WEBHOOK] User created successfully` messages
- OR `[API_LIMIT] User created via fallback` messages
- No error messages

✅ **In Database**:
- User records exist for all sign-ins
- clerkId matches Clerk user ID
- Email, name, photo populated
- Token counts correct (10 available for new users)

✅ **In Browser**:
- Sign-in works smoothly
- Dashboard loads without errors
- Token counts display correctly
- No console errors

---

**Ready to deploy?**  
Copy-paste commands from Step 2 and follow the checklist! 🚀

