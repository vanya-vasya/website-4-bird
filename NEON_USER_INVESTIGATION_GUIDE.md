# 🔍 Neon Database User Investigation Guide

## 🎯 Objective
Investigate why user account `vladimir.serushko.gmail.com` is missing from the Neon production database.

---

## 📋 Quick Investigation Steps

### Step 1: Get Production Database URL

#### Option A: From Vercel Dashboard (Recommended)

1. **Go to Vercel Project Settings**:
   ```
   https://vercel.com/vladis-projects-8c520e18/website-3/settings/environment-variables
   ```

2. **Find DATABASE_URL variable**:
   - Look for environment variable named `DATABASE_URL`
   - It should look like:
     ```
     postgresql://username:password@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
     ```

3. **Copy the value** (you'll need it in Step 2)

#### Option B: From Neon Console

1. **Log into Neon**: https://console.neon.tech
2. **Select your project**: yum-mi or similar
3. **Click "Connection Details"**
4. **Copy the connection string**

---

### Step 2: Run Investigation Script

Once you have the DATABASE_URL, run:

```bash
cd /Users/vladi/Documents/Projects/webapps/yum-mi

# Replace the URL below with your actual production DATABASE_URL
DATABASE_URL="postgresql://username:password@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require" \
  node scripts/investigate-neon-user.js
```

**The script will:**
- ✅ Connect to production Neon database
- ✅ Search for user by multiple email variants
- ✅ Show all users in the database
- ✅ Analyze email patterns
- ✅ Check transactions
- ✅ Provide recommendations

---

## 🔬 What the Investigation Will Check

### 1. User Search Variants

The script searches for these email variations:
- `vladimir.serushko.gmail.com` (as provided)
- `vladimir.serushko@gmail.com` (normalized with @)
- `vladimirserushko@gmail.com` (no dots)
- `vladimir_serushko@gmail.com` (underscore variant)

### 2. Database Statistics

- Total user count
- Total transactions
- Email pattern analysis
- Recent transaction activity

### 3. Partial Matches

Searches for users with:
- Email containing "vladimir"
- Email containing "serushko"
- First name containing "vladimir"
- Last name containing "serushko"

### 4. All Users List

Shows first 20 users to verify:
- Database is populated
- Email format patterns
- User creation is working

---

## 🎯 Possible Root Causes & Solutions

### 1. ❌ User Never Signed Up in Clerk

**Symptoms:**
- User not found in database
- User not in Clerk dashboard

**Verification:**
1. Log into Clerk Dashboard: https://dashboard.clerk.com
2. Go to Users section
3. Search for: `vladimir.serushko@gmail.com`

**Solution:**
- User needs to complete signup process
- Or manually create user in Clerk dashboard

---

### 2. ❌ Clerk Webhook Failed

**Symptoms:**
- User exists in Clerk dashboard
- User NOT in database
- Webhook errors in logs

**Verification:**
1. Check Clerk Dashboard → Webhooks → Logs
2. Check Vercel → Logs → Search for "clerk" webhook errors
3. Look for POST requests to `/api/webhooks/clerk`

**Common Issues:**
- WEBHOOK_SECRET not set in Vercel
- Webhook URL not configured correctly
- Webhook endpoint returns error

**Solution:**

```bash
# 1. Verify Clerk webhook configuration:
#    URL: https://www.yum-mi.com/api/webhooks/clerk
#    Events: user.created, user.updated, user.deleted
#    Status: Active

# 2. Verify WEBHOOK_SECRET in Vercel environment variables

# 3. Test webhook endpoint:
curl https://www.yum-mi.com/api/webhooks/clerk
# Should return: Error (no headers) but endpoint is reachable

# 4. If user exists in Clerk, manually trigger by updating user
```

---

### 3. ❌ Email Normalization Issue

**Symptoms:**
- User exists but with different email format
- Partial match found but not exact match

**Common Scenarios:**

**Gmail Dot Notation:**
- Gmail treats `vladimir.serushko@gmail.com` and `vladimirserushko@gmail.com` as the same
- Database might have one format, search uses another

**Solution:**
```javascript
// Update search to handle Gmail dots
// Already implemented in investigation script
```

---

### 4. ❌ Wrong Database Branch/Environment

**Symptoms:**
- Database appears empty or has different users
- Wrong region or endpoint

**Verification:**
```bash
# Check DATABASE_URL in production:
vercel env pull .env.production

# Compare with local DATABASE_URL
cat .env.local | grep DATABASE_URL
```

**Solution:**
- Ensure using production DATABASE_URL, not preview/development
- Verify Neon branch is "main" or "production"

---

### 5. ❌ User Was Deleted

**Symptoms:**
- User existed before but now missing
- Transaction records exist without user

**Verification:**
```sql
-- Check transactions for orphaned userId
SELECT * FROM "Transaction" 
WHERE "userId" NOT IN (SELECT "clerkId" FROM "User");
```

**Solution:**
- Check Clerk dashboard for user status
- Review deletion logs
- If accidentally deleted, user must re-signup

---

## 🔧 Manual User Creation (If Needed)

If the user exists in Clerk but not in the database, you can manually sync:

### Option 1: Trigger Clerk Webhook

1. Go to Clerk Dashboard → Users
2. Find the user
3. Click "..." menu → Edit
4. Change any field (e.g., add a space to first name)
5. Save
6. This will trigger `user.updated` webhook
7. Check database after webhook fires

### Option 2: Direct Database Insert

⚠️ **Only if webhook is broken and needs immediate fix**

```javascript
// scripts/manually-create-user.js
const { PrismaClient } = require('@prisma/client');

async function createUser() {
  const prisma = new PrismaClient();
  
  try {
    // Get user details from Clerk Dashboard first!
    const user = await prisma.user.create({
      data: {
        clerkId: "user_xxx", // From Clerk dashboard
        email: "vladimir.serushko@gmail.com",
        photo: "https://...", // From Clerk
        firstName: "Vladimir",
        lastName: "Serushko",
        usedGenerations: 0,
        availableGenerations: 20,
      },
    });
    
    console.log('User created:', user);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createUser();
```

Run with:
```bash
DATABASE_URL="postgresql://..." node scripts/manually-create-user.js
```

---

## 📊 Investigation Checklist

Use this checklist while investigating:

### Database Verification
- [ ] Connected to production Neon database (not local SQLite)
- [ ] Database has users (totalUsers > 0)
- [ ] Recent transactions exist (confirms webhook is working)

### User Search
- [ ] Searched for exact email: `vladimir.serushko.gmail.com`
- [ ] Searched for normalized email: `vladimir.serushko@gmail.com`
- [ ] Searched for no-dot variant: `vladimirserushko@gmail.com`
- [ ] Checked partial matches (first/last name)

### Clerk Integration
- [ ] User exists in Clerk dashboard
- [ ] Webhook is configured and active
- [ ] WEBHOOK_SECRET is set in Vercel
- [ ] Recent webhook deliveries are successful

### Environment
- [ ] Using production DATABASE_URL from Vercel
- [ ] Neon branch is correct (main/production)
- [ ] Database region matches expected region

---

## 🎯 Expected Investigation Output

When you run the investigation script, you should see:

```
🔍 NEON DATABASE USER INVESTIGATION
═══════════════════════════════════════════════════════════

Database Type: Neon PostgreSQL (Production)
Connection String: postgresql://****@ep-xxxxx.us-east-2.aws.neon.tech/neondb

📡 Testing Database Connection
✅ Database connected successfully

Neon Endpoint: ep-xxxxx
Region: US East

🎯 Searching for Target User
Target email variants:
   • vladimir.serushko.gmail.com
   • vladimir.serushko@gmail.com
   • vladimirserushko@gmail.com
   • vladimir_serushko@gmail.com

[User found OR User not found message]

📊 Database Statistics
Total Users: X
Total Transactions: Y

🔍 Searching for Partial Matches
[List of users matching vladimir/serushko]

📋 All Users in Database (First 20)
[List of users with emails]

💳 Recent Transactions (Last 10)
[Recent payment transactions]

🎯 Investigation Summary & Recommendations
[Specific recommendations based on findings]
```

---

## 🚨 Common Issues & Quick Fixes

### Issue: "Cannot reach database server"

```bash
# Check internet connection
ping console.neon.tech

# Verify DATABASE_URL format
echo $DATABASE_URL | grep "neon.tech"

# Try connecting with psql
psql "postgresql://..." -c "SELECT 1;"
```

### Issue: "Database connection timeout"

- **Cause**: Neon free tier databases sleep after inactivity
- **Solution**: Wait 10-20 seconds and try again

### Issue: "Authentication failed"

- **Cause**: Wrong password in DATABASE_URL
- **Solution**: Get fresh DATABASE_URL from Neon/Vercel

---

## 📞 Getting Help

### Neon Support
- Console: https://console.neon.tech
- Documentation: https://neon.tech/docs
- Support: support@neon.tech

### Clerk Support
- Dashboard: https://dashboard.clerk.com
- Documentation: https://clerk.com/docs
- Support: support@clerk.com

### Vercel Support
- Dashboard: https://vercel.com
- Documentation: https://vercel.com/docs
- Logs: Check deployment logs for errors

---

## 🎓 Understanding the User Creation Flow

**Normal flow when a user signs up:**

```
1. User visits: www.yum-mi.com/sign-up
   ↓
2. User enters email and creates account in Clerk
   ↓
3. Clerk creates user account (stored in Clerk)
   ↓
4. Clerk sends webhook to: www.yum-mi.com/api/webhooks/clerk
   ↓
5. Webhook handler receives "user.created" event
   ↓
6. Handler calls createUser() from lib/actions/user.actions.ts
   ↓
7. Prisma creates user record in Neon database
   ↓
8. User is synced (exists in both Clerk AND database)
   ✅ Complete!
```

**If user is missing from database, break occurred at step 4, 5, 6, or 7**

---

## 🔍 Advanced Debugging

### Check Clerk Webhook Logs

1. Go to: https://dashboard.clerk.com
2. Navigate to: Webhooks → Your webhook
3. Click "Logs" tab
4. Look for deliveries to `/api/webhooks/clerk`
5. Check HTTP status codes:
   - 200 OK = Success ✅
   - 400/500 = Error ❌

### Check Vercel Function Logs

1. Go to: https://vercel.com/vladis-projects-8c520e18/website-3
2. Navigate to: Logs
3. Filter by: `/api/webhooks/clerk`
4. Look for errors in the function execution

### Direct Database Query

```bash
# Install psql if not available
brew install postgresql

# Connect directly to Neon
psql "postgresql://username:password@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Run queries
SELECT * FROM "User" WHERE email ILIKE '%vladimir%';
SELECT * FROM "User" WHERE email ILIKE '%serushko%';
SELECT COUNT(*) FROM "User";
SELECT * FROM "Transaction" ORDER BY paid_at DESC LIMIT 5;
```

---

## ✅ Resolution Steps

Once you identify the issue:

### If User Never Signed Up
1. User needs to visit: https://www.yum-mi.com/sign-up
2. Complete signup process
3. Verify user appears in both Clerk and database

### If Webhook Failed
1. Fix webhook configuration
2. Update user in Clerk dashboard (triggers webhook)
3. Verify user is created in database

### If Email Normalization Issue
1. User exists but with different email format
2. No action needed if partial match found
3. Update search logic if needed

### If Wrong Database
1. Get correct production DATABASE_URL
2. Re-run investigation script
3. User should be found

---

## 📊 Investigation Report Template

After running the investigation, document findings:

```markdown
## Investigation Results

**Date**: [Current date]
**Investigator**: [Your name]
**Target User**: vladimir.serushko.gmail.com

### Database Information
- **Type**: Neon PostgreSQL
- **Endpoint**: ep-xxxxx
- **Total Users**: X
- **Total Transactions**: Y

### Search Results
- **Exact Match**: [Found/Not Found]
- **Partial Match**: [Found/Not Found]
- **Email Variants Checked**: 4

### Findings
[Describe what you found]

### Root Cause
[Identify the reason user is missing]

### Resolution
[Steps taken or recommended to fix]

### Verification
[How to verify the fix worked]
```

---

## 🎯 Next Steps

1. **Run the investigation script** with production DATABASE_URL
2. **Review the output** and identify which scenario applies
3. **Follow the resolution steps** for your specific case
4. **Verify the fix** by re-running the investigation
5. **Document the resolution** for future reference

---

**Created**: October 14, 2025  
**Script**: `/scripts/investigate-neon-user.js`  
**Status**: Ready to investigate

