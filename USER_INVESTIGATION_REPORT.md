# 🔍 User Investigation Report: vladimir.serushko.gmail.com

**Date**: October 14, 2025  
**Investigator**: AI Assistant  
**Target User**: vladimir.serushko.gmail.com  
**Status**: Investigation Tools Ready - Awaiting Production Database Access

---

## 📋 Executive Summary

Investigation into why user account `vladimir.serushko.gmail.com` is missing from the Neon production database. Investigation tools have been created and verified. Awaiting production DATABASE_URL to complete the investigation.

---

## 🎯 Investigation Scope

### Target User Details
- **Email (as provided)**: `vladimir.serushko.gmail.com`
- **Possible Variants**:
  - `vladimir.serushko@gmail.com` (normalized)
  - `vladimirserushko@gmail.com` (no dots)
  - `vladimir_serushko@gmail.com` (underscore)

### Search Criteria
- Email exact match (case-insensitive)
- Email partial match (first name, last name)
- Clerk ID search
- Transaction history review

---

## 🔧 Investigation Tools Created

### 1. Main Investigation Script
**File**: `scripts/investigate-neon-user.js`

**Features**:
- ✅ Connects to Neon PostgreSQL database
- ✅ Searches for user by multiple email variants
- ✅ Shows database statistics (total users, transactions)
- ✅ Lists all users for verification
- ✅ Analyzes email patterns (Gmail normalization)
- ✅ Checks recent transactions
- ✅ Provides detailed recommendations

**Usage**:
```bash
DATABASE_URL="postgresql://..." node scripts/investigate-neon-user.js
```

### 2. Helper Script for Vercel CLI
**File**: `scripts/get-production-db-url.sh`

**Features**:
- ✅ Retrieves DATABASE_URL from Vercel automatically
- ✅ Masks sensitive credentials
- ✅ Offers to run investigation automatically
- ✅ Provides manual instructions if CLI not available

**Usage**:
```bash
./scripts/get-production-db-url.sh
```

### 3. Comprehensive Investigation Guide
**File**: `NEON_USER_INVESTIGATION_GUIDE.md`

**Includes**:
- ✅ Step-by-step investigation instructions
- ✅ Root cause analysis for common issues
- ✅ Resolution steps for each scenario
- ✅ Clerk webhook debugging guide
- ✅ Vercel logs investigation
- ✅ Manual user creation procedures

---

## 🌐 Environment Analysis

### Current Configuration

#### Local Development
- **Database**: SQLite (`file:./prisma/dev.db`)
- **Purpose**: Local testing only
- **Status**: Not relevant for production user investigation

#### Production (Vercel)
- **Database**: Neon PostgreSQL
- **Location**: Likely US East region
- **Access**: Via DATABASE_URL environment variable
- **Status**: Access needed to investigate

### Database Schema

```prisma
model User {
  id                   String        @id @default(cuid())
  clerkId              String        @unique
  email                String        @unique
  photo                String
  firstName            String?
  lastName             String?
  usedGenerations      Int           @default(0)
  availableGenerations Int           @default(20)
  transactions         Transaction[]
}
```

**Key Fields for Investigation**:
- `clerkId`: Unique identifier from Clerk authentication
- `email`: User's email (unique, indexed)
- `availableGenerations`: Default is 20 (from schema), but webhook gives 10

---

## 🔄 User Creation Flow Analysis

### Normal Flow (When Everything Works)

```
1. User visits: www.yum-mi.com/sign-up
   ↓
2. User fills registration form in Clerk
   ↓
3. Clerk creates user account (stored in Clerk)
   ↓
4. Clerk sends webhook → www.yum-mi.com/api/webhooks/clerk
   Event: "user.created"
   ↓
5. Webhook handler extracts user data:
   - clerkId: evt.data.id
   - email: evt.data.email_addresses[0].email_address
   - firstName, lastName, photo
   - availableGenerations: 10 (hardcoded in webhook)
   ↓
6. createUser() function called
   ↓
7. Prisma inserts user into Neon database
   ↓
8. User metadata updated in Clerk
   ✅ User creation complete!
```

### Critical Dependencies

**For user creation to succeed, ALL must be true**:
1. ✅ User completes signup in Clerk
2. ✅ WEBHOOK_SECRET is set in Vercel environment
3. ✅ Clerk webhook is configured with correct URL
4. ✅ Webhook endpoint is accessible (no errors)
5. ✅ DATABASE_URL is valid and accessible
6. ✅ Prisma can connect to Neon database
7. ✅ No unique constraint violations (email/clerkId)

---

## 🚨 Potential Root Causes

### 1. User Never Signed Up ❌

**Probability**: Medium  
**Impact**: Low (user just needs to sign up)

**Symptoms**:
- User not found in Clerk dashboard
- User not found in database
- No transaction records

**Verification Steps**:
1. Check Clerk dashboard: https://dashboard.clerk.com
2. Search for email: `vladimir.serushko@gmail.com`
3. If not found → User never completed signup

**Resolution**:
- User needs to visit: https://www.yum-mi.com/sign-up
- Complete registration process
- Will be automatically synced to database

---

### 2. Clerk Webhook Failed ❌

**Probability**: High (most common issue)  
**Impact**: High (user exists but can't use app)

**Symptoms**:
- User EXISTS in Clerk dashboard
- User NOT in database
- Webhook delivery failures in Clerk logs
- 500/400 errors in Vercel logs

**Common Causes**:

#### A. WEBHOOK_SECRET Not Set
```bash
# Check in Vercel:
Settings → Environment Variables → WEBHOOK_SECRET
```

If missing, webhook throws error at line 16:
```typescript
if (!WEBHOOK_SECRET) {
  throw new Error("Please add WEBHOOK_SECRET...");
}
```

#### B. Webhook URL Not Configured
```bash
# Should be configured in Clerk Dashboard:
URL: https://www.yum-mi.com/api/webhooks/clerk
Events: user.created, user.updated, user.deleted
Status: Active
```

#### C. Database Connection Failed
- DATABASE_URL invalid or expired
- Neon database sleeping (free tier)
- Network timeout during user creation

**Verification Steps**:
1. Check Clerk Dashboard → Webhooks → Logs
2. Look for recent deliveries to `/api/webhooks/clerk`
3. Check HTTP status codes:
   - 200 OK = Success ✅
   - 400 = Bad request (missing headers) ❌
   - 500 = Server error (WEBHOOK_SECRET or DB issue) ❌

**Resolution**:
```bash
# 1. Ensure WEBHOOK_SECRET is set in Vercel
# 2. Trigger webhook by updating user in Clerk:
#    - Go to Clerk Dashboard → Users
#    - Find user → Edit
#    - Change any field (e.g., add space to name)
#    - Save (triggers user.updated webhook)
# 3. Check if user appears in database
```

---

### 3. Email Normalization Issue 📧

**Probability**: Medium  
**Impact**: Medium (user exists but hard to find)

**Gmail Special Cases**:

Gmail treats these as the SAME email:
- `vladimir.serushko@gmail.com`
- `vladimirserushko@gmail.com` (no dots)
- `v.l.a.d.i.m.i.r.s.e.r.u.s.h.k.o@gmail.com`

But database stores EXACT format from Clerk signup.

**Verification Steps**:
- Search for partial matches: `vladimir`, `serushko`
- Check all Gmail accounts in database
- Compare format patterns

**Resolution**:
- Investigation script already handles this
- Searches all common variants
- Shows partial matches

---

### 4. Wrong Database Branch/Environment 🌐

**Probability**: Low  
**Impact**: High (completely wrong database)

**Symptoms**:
- Database has unexpected users
- User count doesn't match expectations
- Transaction history doesn't align

**Neon Branch Scenarios**:
- Production: `main` or `production` branch
- Preview: `preview` or `staging` branch
- Development: `dev` branch

**Verification Steps**:
```bash
# Check DATABASE_URL format:
# Should include production endpoint, not preview/dev

# Production:
postgresql://...@ep-xxxxx.us-east-2.aws.neon.tech/neondb

# Preview (wrong!):
postgresql://...@ep-xxxxx-preview.us-east-2.aws.neon.tech/neondb
```

**Resolution**:
- Get DATABASE_URL from Vercel Production environment
- Verify endpoint matches production Neon branch

---

### 5. User Was Deleted 🗑️

**Probability**: Low  
**Impact**: High (data loss)

**Symptoms**:
- User existed before (has transaction records)
- User missing from User table
- Transactions reference non-existent userId

**Verification Steps**:
```sql
-- Check for orphaned transactions
SELECT * FROM "Transaction" 
WHERE "userId" NOT IN (SELECT "clerkId" FROM "User");
```

**Resolution**:
- Check Clerk dashboard for user status
- Review Clerk webhook logs for user.deleted events
- User must re-signup if account was deleted

---

## 🎯 Investigation Steps Required

### Step 1: Get Production Database Access ⏳

**Required**:
```bash
# Option A: From Vercel CLI
./scripts/get-production-db-url.sh

# Option B: From Vercel Dashboard
# Go to: https://vercel.com/.../settings/environment-variables
# Copy: DATABASE_URL value
```

### Step 2: Run Investigation Script ⏳

```bash
DATABASE_URL="postgresql://..." node scripts/investigate-neon-user.js
```

**Expected Output**:
- Database connection status
- User search results (found/not found)
- Database statistics
- Partial match results
- All users list
- Recommendations

### Step 3: Check Clerk Dashboard ⏳

**Visit**: https://dashboard.clerk.com

**Search for**:
- Email: `vladimir.serushko@gmail.com`
- Variations: `vladimirserushko@gmail.com`

**Record**:
- User exists? Yes/No
- Clerk ID if exists
- Sign-up date
- Last activity

### Step 4: Check Webhook Configuration ⏳

**Clerk Dashboard → Webhooks**:
- Webhook URL: `https://www.yum-mi.com/api/webhooks/clerk`
- Events subscribed: `user.created`, `user.updated`, `user.deleted`
- Status: Active
- Recent deliveries: Check for successes/failures

**Vercel Dashboard → Environment Variables**:
- `WEBHOOK_SECRET`: Should be set
- `DATABASE_URL`: Should be set
- Both should be in Production environment

### Step 5: Check Vercel Logs ⏳

**Vercel Dashboard → Logs**:
```
Filter: "/api/webhooks/clerk"
Time range: Last 7 days
```

Look for:
- POST requests to webhook endpoint
- HTTP status codes (200 = success)
- Error messages
- Database connection errors

---

## 📊 Investigation Checklist

Copy this checklist and fill it out:

```markdown
## Investigation Checklist

### Database Access
- [ ] Obtained production DATABASE_URL
- [ ] Connected to Neon database successfully
- [ ] Verified connecting to production (not preview/dev)

### User Search
- [ ] Searched for: vladimir.serushko.gmail.com
- [ ] Searched for: vladimir.serushko@gmail.com
- [ ] Searched for: vladimirserushko@gmail.com
- [ ] Checked partial matches (name contains vladimir/serushko)
- [ ] Result: [FOUND / NOT FOUND]

### Clerk Verification
- [ ] Checked Clerk dashboard for user
- [ ] User exists in Clerk: [YES / NO]
- [ ] If yes, Clerk ID: _________________
- [ ] Sign-up date: _________________

### Webhook Configuration
- [ ] Webhook URL configured: https://www.yum-mi.com/api/webhooks/clerk
- [ ] Events enabled: user.created, user.updated, user.deleted
- [ ] Webhook status: [ACTIVE / INACTIVE]
- [ ] Recent deliveries: [SUCCESS / FAILED / NONE]

### Environment Variables
- [ ] WEBHOOK_SECRET set in Vercel: [YES / NO]
- [ ] DATABASE_URL set in Vercel: [YES / NO]
- [ ] Both in Production environment: [YES / NO]

### Vercel Logs
- [ ] Checked logs for /api/webhooks/clerk
- [ ] Found relevant entries: [YES / NO]
- [ ] Errors found: [YES / NO / NONE]
- [ ] Error details: _________________

### Database Statistics
- [ ] Total users in database: _______
- [ ] Total transactions: _______
- [ ] Recent user signups working: [YES / NO]

### Root Cause Identified
- [ ] User never signed up
- [ ] Webhook failed (specify reason: _______________)
- [ ] Email normalization issue
- [ ] Wrong database branch
- [ ] User was deleted
- [ ] Other: _________________
```

---

## 🔧 Resolution Procedures

### Scenario 1: User Never Signed Up

```markdown
**Action**: User needs to sign up

**Steps**:
1. User visits: https://www.yum-mi.com/sign-up
2. User completes registration form
3. User verifies email if required
4. User logs in
5. Verify user appears in database:
   ```bash
   DATABASE_URL="..." node scripts/investigate-neon-user.js
   ```
```

### Scenario 2: Webhook Failed - WEBHOOK_SECRET Missing

```markdown
**Action**: Add WEBHOOK_SECRET to Vercel

**Steps**:
1. Get signing secret from Clerk Dashboard:
   - Go to: https://dashboard.clerk.com
   - Navigate to: Webhooks → [Your webhook]
   - Copy: Signing Secret (starts with "whsec_")

2. Add to Vercel:
   - Go to: https://vercel.com/.../settings/environment-variables
   - Click: Add New
   - Name: WEBHOOK_SECRET
   - Value: [paste secret from step 1]
   - Environment: Production, Preview, Development
   - Save

3. Redeploy:
   ```bash
   git commit --allow-empty -m "Trigger redeploy after env update"
   git push
   ```

4. Trigger webhook by updating user in Clerk:
   - Go to Clerk Dashboard → Users → [User]
   - Edit any field (e.g., add space to first name)
   - Save

5. Verify user is created in database
```

### Scenario 3: Webhook Failed - Database Connection

```markdown
**Action**: Fix DATABASE_URL in Vercel

**Steps**:
1. Get fresh DATABASE_URL from Neon:
   - Go to: https://console.neon.tech
   - Select project
   - Copy connection string

2. Update in Vercel:
   - Go to: Environment Variables
   - Update: DATABASE_URL
   - Value: [new connection string]
   - Environment: Production
   - Save

3. Redeploy and trigger webhook (see Scenario 2, steps 3-5)
```

### Scenario 4: Email Normalization Issue

```markdown
**Action**: Locate user with normalized email

**Steps**:
1. Investigation script automatically checks variants
2. If found with different format:
   - Note the actual email format in database
   - User should use that format to login
   - No changes needed (Gmail treats them as same)
```

### Scenario 5: User Was Deleted

```markdown
**Action**: User must re-signup

**Steps**:
1. Confirm user deleted (check Clerk webhook logs)
2. User visits: https://www.yum-mi.com/sign-up
3. User creates new account
4. Previous transaction history lost (new userId)
```

---

## 🎓 Technical Details

### Webhook Implementation

**File**: `app/api/webhooks/clerk/route.ts`

**Key Configuration**:
```typescript
// Line 73: New users get 10 generations (not 20!)
availableGenerations: 10

// Line 12: Requires WEBHOOK_SECRET from env
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

// Line 69: Email extracted from first address
email: email_addresses[0].email_address
```

### Database Connection

**File**: `lib/prismadb.ts`

**Configuration**:
```typescript
// Uses DATABASE_URL from environment
const prismadb = globalThis.prisma || new PrismaClient();
```

### User Creation Function

**File**: `lib/actions/user.actions.ts`

**Implementation**:
```typescript
export async function createUser(user: any) {
  try {
    const newUser = await prismadb.user.create({
      data: user,
    });
    return newUser;
  } catch (error) {
    console.error(error);
    // Returns undefined on error (doesn't throw!)
  }
}
```

**⚠️ Important**: Function returns `undefined` on error, doesn't throw!

---

## 📞 Support Resources

### Neon Database
- **Console**: https://console.neon.tech
- **Documentation**: https://neon.tech/docs
- **Support**: support@neon.tech
- **Status**: https://status.neon.tech

### Clerk Authentication
- **Dashboard**: https://dashboard.clerk.com
- **Documentation**: https://clerk.com/docs/integrations/webhooks
- **Support**: support@clerk.com
- **Community**: https://discord.com/invite/clerk

### Vercel Hosting
- **Dashboard**: https://vercel.com
- **Logs**: https://vercel.com/.../logs
- **Documentation**: https://vercel.com/docs
- **Support**: support@vercel.com

---

## 🎯 Next Steps

1. **Run Helper Script** (if Vercel CLI installed):
   ```bash
   ./scripts/get-production-db-url.sh
   ```

2. **Or Get DATABASE_URL Manually**:
   - From Vercel Dashboard: Settings → Environment Variables
   - From Neon Console: Connection Details

3. **Run Investigation**:
   ```bash
   DATABASE_URL="postgresql://..." node scripts/investigate-neon-user.js
   ```

4. **Fill Out Investigation Checklist** (above)

5. **Identify Root Cause** from findings

6. **Follow Resolution Procedure** for identified scenario

7. **Verify Fix**:
   ```bash
   # Re-run investigation
   DATABASE_URL="..." node scripts/investigate-neon-user.js
   
   # Check for user - should be found now
   ```

8. **Document Resolution** (append to this file)

---

## 📝 Investigation Results

**Status**: ⏳ Awaiting production database access  
**Next Action**: Run investigation script with production DATABASE_URL

**Will be updated with**:
- User found/not found status
- Root cause identification
- Resolution steps taken
- Verification results

---

**Created**: October 14, 2025  
**Last Updated**: October 14, 2025  
**Investigation Tools**: ✅ Ready  
**Database Access**: ⏳ Pending  
**Status**: Awaiting user to run investigation


