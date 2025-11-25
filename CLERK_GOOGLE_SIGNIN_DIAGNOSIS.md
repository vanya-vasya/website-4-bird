# 🔍 Clerk Google Sign-In → Database User Creation Diagnosis

**Issue**: Users signing in via Google OAuth don't get created in `database.users` table  
**Date**: October 14, 2025  
**Status**: ROOT CAUSES IDENTIFIED + FIXES PROVIDED

---

## 🎯 ROOT CAUSES IDENTIFIED

### 1. **Webhook Only Fires on NEW User Creation** ❌

**Current Implementation**:
```typescript
// app/api/webhooks/clerk/route.ts:64
if (eventType === "user.created") {
  // Creates user in database
}
```

**Problem**: 
- `user.created` webhook ONLY fires when user **first signs up**
- **Google Sign-In for EXISTING users** does NOT fire `user.created`
- If user exists in Clerk but NOT in database → NO webhook → NO database record

**Scenario**:
1. User visits site → starts signup → closes browser (user created in Clerk)
2. User returns → signs in with Google → Clerk recognizes user
3. **NO `user.created` webhook** (user already exists in Clerk)
4. Dashboard loads → queries database → **user not found** → crash

---

### 2. **No Upsert/Fallback Mechanism** ❌

**Current Flow**:
```
Sign In → Clerk Auth → Middleware checks auth → Dashboard loads
                                                    ↓
                                          getUserById() or getApiUsedGenerations()
                                                    ↓
                                               Database query
                                                    ↓
                                               User not found → ERROR
```

**Problem**: No server-side check to create user if missing from database

---

### 3. **Silent Error Handling** ❌

**Current Code** (`lib/actions/user.actions.ts:8-17`):
```typescript
export async function createUser(user: any) {
  try {
    const newUser = await prismadb.user.create({
      data: user,
    });
    return newUser;
  } catch (error) {
    console.error(error);  // ← Just logs, returns undefined
  }
}
```

**Problems**:
- No error thrown → webhook returns 200 even if DB insert fails
- Clerk thinks webhook succeeded
- No retry mechanism
- No detailed error logging

---

### 4. **Webhook Configuration Issues** ⚠️

**Required Configuration in Clerk Dashboard**:
```
Webhook URL: https://www.yum-mi.com/api/webhooks/clerk
Events: 
  ✅ user.created
  ✅ user.updated  
  ✅ user.deleted
Status: Active
WEBHOOK_SECRET: whsec_Evuu+3/9O3LgKvhQQ/AyJc6hIlC2pmUj
```

**Potential Issues**:
- Webhook URL not set or wrong domain
- Events not subscribed
- WEBHOOK_SECRET not set in Vercel
- Webhook disabled or failing

---

## 📊 DIAGNOSTIC RESULTS

### Test 1: Database Connection ✅
```bash
$ node scripts/investigate-neon-user.js
✅ Database connected successfully
⚠️  No users found in database!
```

**Result**: Database works, but empty (webhooks not creating users)

---

### Test 2: Webhook Endpoint (Manual Check)

```bash
# Test if endpoint is reachable
curl -X GET https://www.yum-mi.com/api/webhooks/clerk
# Expected: {"message":"OK"}
```

---

### Test 3: Environment Variables

**In Vercel** (Check these):
```bash
✅ DATABASE_URL = postgresql://neondb_owner:...@ep-...pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
✅ WEBHOOK_SECRET = whsec_Evuu+3/9O3LgKvhQQ/AyJc6hIlC2pmUj
✅ CLERK_SECRET_KEY = sk_test_...
✅ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = pk_test_...
```

---

## 🔧 FIXES REQUIRED

### Fix #1: Enhanced Webhook Handler with Logging

**Replace** `app/api/webhooks/clerk/route.ts` with enhanced version

---

### Fix #2: Implement createOrGetUser Function

**Add to** `lib/actions/user.actions.ts`:

```typescript
// UPSERT - Create user if not exists, return existing if exists
export async function createOrGetUser(clerkUser: {
  clerkId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  photo: string;
}) {
  try {
    console.log('[CREATE_OR_GET_USER] Starting for clerkId:', clerkUser.clerkId);
    
    // Try to find existing user
    const existingUser = await prismadb.user.findUnique({
      where: { clerkId: clerkUser.clerkId },
    });

    if (existingUser) {
      console.log('[CREATE_OR_GET_USER] User exists:', existingUser.id);
      return existingUser;
    }

    // User doesn't exist, create new
    console.log('[CREATE_OR_GET_USER] Creating new user');
    const newUser = await prismadb.user.create({
      data: {
        clerkId: clerkUser.clerkId,
        email: clerkUser.email,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        photo: clerkUser.photo,
        availableGenerations: 10,
        usedGenerations: 0,
      },
    });

    console.log('[CREATE_OR_GET_USER] Created user:', newUser.id);
    return newUser;
    
  } catch (error) {
    console.error('[CREATE_OR_GET_USER] Error:', error);
    throw error; // Re-throw to handle upstream
  }
}
```

---

### Fix #3: Add Fallback in api-limit.ts

**Update** `lib/api-limit.ts` to auto-create users:

```typescript
import { auth, currentUser } from "@clerk/nextjs/server";
import prismadb from "@/lib/prismadb";
import { createOrGetUser } from "@/lib/actions/user.actions";

export const getApiAvailableGenerations = async () => {
  try {
    const { userId } = auth();
    if (!userId) return 0;

    let userApiLimit = await prismadb.user.findUnique({
      where: { clerkId: userId },
    });

    // FALLBACK: If user not in DB, create them
    if (!userApiLimit) {
      console.log('[API_LIMIT] User not found in DB, creating...');
      const clerkUser = await currentUser();
      
      if (clerkUser) {
        userApiLimit = await createOrGetUser({
          clerkId: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          photo: clerkUser.imageUrl || '',
        });
      }
    }

    if (!userApiLimit) return 0;
    return userApiLimit.availableGenerations;
    
  } catch (error) {
    console.error("[GET_API_AVAILABLE_GENERATIONS]", error);
    return 0;
  }
};
```

---

### Fix #4: Enhanced Error Handling in createUser

**Update** `createUser` function:

```typescript
export async function createUser(user: any) {
  try {
    console.log('[CREATE_USER] Attempting to create user:', {
      clerkId: user.clerkId,
      email: user.email,
    });

    const newUser = await prismadb.user.create({
      data: user,
    });

    console.log('[CREATE_USER] Success! Created user:', newUser.id);
    return newUser;
    
  } catch (error: any) {
    console.error('[CREATE_USER] FAILED:', {
      code: error.code,
      message: error.message,
      clerkId: user.clerkId,
      email: user.email,
    });
    
    // If user already exists (unique constraint), try to return existing
    if (error.code === 'P2002') {
      console.log('[CREATE_USER] User already exists, fetching...');
      try {
        const existing = await prismadb.user.findUnique({
          where: { clerkId: user.clerkId },
        });
        return existing;
      } catch (findError) {
        console.error('[CREATE_USER] Could not find existing user:', findError);
      }
    }
    
    throw error; // Re-throw to trigger webhook retry
  }
}
```

---

## 🧪 TESTING PROCEDURE

### Test 1: Verify Webhook Configuration

**Go to Clerk Dashboard**:
```
1. https://dashboard.clerk.com
2. Configure → Webhooks
3. Check your webhook:
   - Endpoint URL: https://www.yum-mi.com/api/webhooks/clerk
   - Events: user.created, user.updated, user.deleted ✅
   - Status: Active ✅
4. Click "Test" to send test event
5. Check "Logs" tab for delivery status
```

---

### Test 2: Check Vercel Logs

**After a Google sign-in attempt**:
```
1. Go to: https://vercel.com/vladis-projects-8c520e18/website-3
2. Click "Logs" tab
3. Filter by: "clerk" or "webhook"
4. Look for:
   - POST /api/webhooks/clerk
   - Status codes (200 = success, 400/500 = error)
   - Error messages
```

---

### Test 3: Manually Trigger Webhook

**Test webhook delivery**:
```
1. Clerk Dashboard → Webhooks → Your webhook
2. Click "Send Example"
3. Select "user.created" event
4. Click "Send"
5. Check Vercel logs for webhook receipt
6. Check database for user creation:
   node scripts/investigate-neon-user.js
```

---

### Test 4: Test Google Sign-In Flow

**Complete flow test**:
```
1. Clear Clerk session (sign out completely)
2. Go to: https://www.yum-mi.com/sign-in
3. Click "Continue with Google"
4. Complete Google OAuth
5. Should redirect to /dashboard
6. Check Vercel logs for:
   - POST /api/webhooks/clerk (webhook fired)
   - [CREATE_USER] or [CREATE_OR_GET_USER] logs
7. Query database:
   node scripts/investigate-neon-user.js
   # Should show 1 user
```

---

## 📋 STEP-BY-STEP RESOLUTION

### Step 1: Update User Actions (5 minutes)

Apply Fix #2 and Fix #4 to `lib/actions/user.actions.ts`

---

### Step 2: Update API Limit (5 minutes)

Apply Fix #3 to `lib/api-limit.ts`

---

### Step 3: Update Webhook Handler (10 minutes)

Apply Fix #1 - enhanced logging to `app/api/webhooks/clerk/route.ts`

---

### Step 4: Verify Webhook in Clerk (2 minutes)

Check Clerk Dashboard webhook configuration

---

### Step 5: Deploy & Test (10 minutes)

```bash
git add -A
git commit -m "Fix: Add user auto-creation fallback for Google OAuth sign-in"
git push origin production/migrate-to-yum-mi-domain
```

Wait for deploy, then test Google sign-in

---

### Step 6: Monitor Logs (Ongoing)

Watch Vercel logs during test sign-ins:
```
https://vercel.com/vladis-projects-8c520e18/website-3/logs
```

Look for:
- `[CREATE_OR_GET_USER]` messages
- `[API_LIMIT]` fallback triggers
- Webhook delivery confirmations

---

## 🎯 SUCCESS CRITERIA

Fix is complete when:

1. ✅ User signs in with Google
2. ✅ Dashboard loads without error
3. ✅ User record exists in database
4. ✅ Token count displays correctly
5. ✅ Vercel logs show successful user creation
6. ✅ No "User not found" errors

---

## 🔍 DEBUGGING CHECKLIST

```markdown
Webhook Configuration:
[ ] Webhook URL is correct in Clerk Dashboard
[ ] Events subscribed: user.created, user.updated, user.deleted
[ ] Webhook status is "Active"
[ ] WEBHOOK_SECRET matches between Clerk and Vercel
[ ] Test webhook delivers successfully

Environment Variables (Vercel):
[ ] DATABASE_URL is set and correct
[ ] WEBHOOK_SECRET is set
[ ] CLERK_SECRET_KEY is set
[ ] All vars in Production, Preview, Development

Code Fixes Applied:
[ ] createOrGetUser function added
[ ] API limit has fallback logic
[ ] Enhanced error logging in place
[ ] createUser handles duplicate errors

Testing:
[ ] Manual webhook test succeeds
[ ] Google sign-in creates user in DB
[ ] Dashboard loads without error
[ ] Vercel logs show user creation
[ ] Database query shows user exists
```

---

## 📊 EXPECTED LOG OUTPUT

### Successful Flow:

**Vercel Logs**:
```
[Webhook] POST /api/webhooks/clerk
[Webhook] Event type: user.created
[CREATE_USER] Attempting to create user: { clerkId: 'user_xxx', email: 'user@gmail.com' }
[CREATE_USER] Success! Created user: clmxxx
[Webhook] User created successfully
```

**Or with fallback**:
```
[API_LIMIT] User not found in DB, creating...
[CREATE_OR_GET_USER] Starting for clerkId: user_xxx
[CREATE_OR_GET_USER] Creating new user
[CREATE_OR_GET_USER] Created user: clmxxx
[API_LIMIT] User created via fallback
```

---

## 🆘 COMMON ISSUES & SOLUTIONS

### Issue 1: "WEBHOOK_SECRET not set"

**Symptoms**: Webhook returns 500 error

**Solution**:
```bash
# Verify in Vercel:
Settings → Environment Variables → WEBHOOK_SECRET
# Should be: whsec_Evuu+3/9O3LgKvhQQ/AyJc6hIlC2pmUj

# If missing, add it
# Redeploy
```

---

### Issue 2: Webhook Never Fires

**Symptoms**: No logs in Vercel when signing in

**Solution**:
```
1. Check Clerk Dashboard → Webhooks
2. Verify endpoint URL: https://www.yum-mi.com/api/webhooks/clerk
3. Check "Logs" tab for delivery attempts
4. If failing, check error message
5. Common issues:
   - Wrong URL (http vs https)
   - URL not reachable
   - Wrong domain (vercel.app vs yum-mi.com)
```

---

### Issue 3: Database Insert Fails

**Symptoms**: Webhook fires but user not in DB

**Solution**:
```bash
# Check Vercel logs for Prisma errors:
# Look for:
# - P2002 (Unique constraint violation)
# - P1001 (Can't reach database)
# - Connection timeout

# If connection issue:
# Verify DATABASE_URL is correct with .c-2.
```

---

## 📝 NEXT STEPS

1. **Apply fixes** to codebase (I'll provide exact code in next response)
2. **Verify webhook** configuration in Clerk
3. **Deploy** to Vercel
4. **Test** Google sign-in
5. **Monitor** logs to confirm user creation
6. **Query database** to verify user exists

---

**Status**: Diagnosis Complete - Fixes Ready  
**Root Cause**: No fallback for existing Clerk users + webhook-only user creation  
**Solution**: Add createOrGetUser with auto-creation fallback  
**Estimated Fix Time**: 30 minutes (code + deploy + test)

