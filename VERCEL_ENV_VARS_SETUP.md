# 🚀 Vercel Environment Variables - Neon Database Setup

**Date**: October 14, 2025  
**Neon Project ID**: `br-muddy-shape-admsxe51`  
**Primary Endpoint**: `ep-sweet-waterfall-adkazkpm` (✅ Active)  
**Status**: Ready to Configure

---

## ✅ CORRECT DATABASE CONNECTION STRING

**The issue was**: Missing `.c-2.` in the hostname!

**Correct URL**:
```
postgresql://neondb_owner:npg_ePTqtkSN7G3W@ep-sweet-waterfall-adkazkpm-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
```

---

## 📋 VERCEL ENVIRONMENT VARIABLES

Copy these **exact values** to Vercel:

### Required for Database Connection

```bash
# Primary database URL (REQUIRED)
DATABASE_URL=postgresql://neondb_owner:npg_ePTqtkSN7G3W@ep-sweet-waterfall-adkazkpm-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require

# Individual PostgreSQL variables (optional, for compatibility)
PGHOST=ep-sweet-waterfall-adkazkpm-pooler.c-2.us-east-1.aws.neon.tech
PGUSER=neondb_owner
PGDATABASE=neondb
PGPASSWORD=npg_ePTqtkSN7G3W
```

---

## 🔧 HOW TO UPDATE VERCEL

### Option 1: Via Vercel Dashboard (Recommended)

1. **Go to Environment Variables**:
   ```
   https://vercel.com/vladis-projects-8c520e18/website-3/settings/environment-variables
   ```

2. **Update DATABASE_URL**:
   - Find existing `DATABASE_URL` variable
   - Click "Edit" (pencil icon)
   - **Replace value with**:
     ```
     postgresql://neondb_owner:npg_ePTqtkSN7G3W@ep-sweet-waterfall-adkazkpm-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
     ```
   - Select environments: ✅ Production ✅ Preview ✅ Development
   - Click "Save"

3. **Add Optional Variables** (if tools need them):
   
   **PGHOST**:
   ```
   Name: PGHOST
   Value: ep-sweet-waterfall-adkazkpm-pooler.c-2.us-east-1.aws.neon.tech
   Environments: Production, Preview, Development
   ```
   
   **PGUSER**:
   ```
   Name: PGUSER
   Value: neondb_owner
   Environments: Production, Preview, Development
   ```
   
   **PGDATABASE**:
   ```
   Name: PGDATABASE
   Value: neondb
   Environments: Production, Preview, Development
   ```
   
   **PGPASSWORD**:
   ```
   Name: PGPASSWORD
   Value: npg_ePTqtkSN7G3W
   Environments: Production, Preview, Development
   Type: Secret (enable "Sensitive")
   ```

4. **Save All Changes**

---

### Option 2: Via Vercel CLI (Alternative)

```bash
# Login to Vercel CLI
vercel login

# Link to project
cd /Users/vladi/Documents/Projects/webapps/yum-mi
vercel link

# Add/update environment variables
vercel env add DATABASE_URL production
# Paste: postgresql://neondb_owner:npg_ePTqtkSN7G3W@ep-sweet-waterfall-adkazkpm-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require

vercel env add DATABASE_URL preview
# Paste same value

vercel env add DATABASE_URL development
# Paste same value

# Optional: Add individual PG variables
vercel env add PGHOST production
# Paste: ep-sweet-waterfall-adkazkpm-pooler.c-2.us-east-1.aws.neon.tech

vercel env add PGUSER production
# Paste: neondb_owner

vercel env add PGDATABASE production
# Paste: neondb

vercel env add PGPASSWORD production
# Paste: npg_ePTqtkSN7G3W
```

---

## 🚀 REDEPLOY AFTER UPDATING

After updating environment variables, you **MUST redeploy**:

### Option A: Trigger Redeploy from Dashboard

1. Go to: https://vercel.com/vladis-projects-8c520e18/website-3/deployments
2. Click on latest deployment
3. Click "..." menu → "Redeploy"
4. Click "Redeploy" button

---

### Option B: Trigger with Git Push

```bash
cd /Users/vladi/Documents/Projects/webapps/yum-mi

# Create empty commit to trigger deploy
git commit --allow-empty -m "Fix: Update DATABASE_URL with correct .c-2. endpoint"
git push origin production/migrate-to-yum-mi-domain
```

---

### Option C: Use Vercel CLI

```bash
cd /Users/vladi/Documents/Projects/webapps/yum-mi
vercel --prod
```

---

## ✅ VERIFICATION CHECKLIST

After redeploying, verify:

```bash
# 1. Check deployment status
# Go to: https://vercel.com/vladis-projects-8c520e18/website-3/deployments
# Wait for deployment to complete (2-3 minutes)

# 2. Test production site
# Visit: https://website-3-hhylc1d5b-vladis-projects-8c520e18.vercel.app/dashboard
# Should load WITHOUT "Application error"

# 3. Check if user data loads
# Token count should display
# No database errors in console

# 4. Check Vercel logs
# Settings → Logs → Filter for errors
# Should see successful database queries
```

---

## 📊 WHAT CHANGED

### Before (Wrong):
```
❌ ep-sweet-waterfall-adkazkpm-pooler.us-east-1.aws.neon.tech
   Missing: .c-2.
   Result: Connection timeout
```

### After (Correct):
```
✅ ep-sweet-waterfall-adkazkpm-pooler.c-2.us-east-1.aws.neon.tech
   Has: .c-2. region identifier
   Result: Connection successful
```

---

## 🔍 NEON PROJECT DETAILS

**Project Information**:
```
Project ID: br-muddy-shape-admsxe51
Primary Endpoint: ep-sweet-waterfall-adkazkpm
Status: Active (Green)
Region: us-east-1 (c-2 availability zone)
Connection Type: Pooler (connection pooling enabled)
```

**Connection String Components**:
```
Protocol: postgresql://
User: neondb_owner
Password: npg_ePTqtkSN7G3W
Host: ep-sweet-waterfall-adkazkpm-pooler.c-2.us-east-1.aws.neon.tech
Port: 5432 (default)
Database: neondb
SSL Mode: require
Channel Binding: require (optional)
```

---

## 🎯 EXPECTED RESULTS

### After Correct Setup:

**Local Development**:
- ✅ `node scripts/investigate-neon-user.js` - Works
- ✅ Database queries succeed
- ✅ User data can be queried

**Vercel Production**:
- ✅ Dashboard loads without errors
- ✅ User token counts display
- ✅ Database-dependent features work
- ✅ Payment history accessible
- ✅ User signup/login works

---

## 🆘 TROUBLESHOOTING

### Issue: Still getting connection errors

**Check**:
1. Verify you saved changes in Vercel
2. Verify you redeployed after updating
3. Check deployment logs for DATABASE_URL value
4. Ensure exact URL (with `.c-2.`) is used

---

### Issue: Environment variable not updating

**Solution**:
```bash
# Delete old variable first
# In Vercel Dashboard:
1. Find DATABASE_URL
2. Click "..." → "Remove"
3. Confirm removal
4. Add new variable with correct value
5. Redeploy
```

---

### Issue: Different endpoints needed

**Neon provides multiple endpoints**:

**Pooler** (Current - Recommended for serverless):
```
ep-sweet-waterfall-adkazkpm-pooler.c-2.us-east-1.aws.neon.tech
```

**Direct** (Alternative - if pooler has issues):
```
ep-sweet-waterfall-adkazkpm.c-2.us-east-1.aws.neon.tech
```

**To switch**: Replace `-pooler` part in DATABASE_URL

---

## 📝 COMPLETE ENVIRONMENT VARIABLES LIST

For reference, here are ALL environment variables that should be in Vercel:

```bash
# Database (CRITICAL)
DATABASE_URL=postgresql://neondb_owner:npg_ePTqtkSN7G3W@ep-sweet-waterfall-adkazkpm-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require

# PostgreSQL Individual (Optional)
PGHOST=ep-sweet-waterfall-adkazkpm-pooler.c-2.us-east-1.aws.neon.tech
PGUSER=neondb_owner
PGDATABASE=neondb
PGPASSWORD=npg_ePTqtkSN7G3W

# Clerk Authentication (Already set)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Webhook (if configured)
WEBHOOK_SECRET=whsec_... (from Clerk Dashboard)

# Secure-Processor Payment (Already set)
SECURE-PROCESSOR_SHOP_ID=29959
SECURE-PROCESSOR_SECRET_KEY=dbfb6f4e977f49880a6ce3c939f1e7be645a5bb2596c04d9a3a7b32d52378950
SECURE-PROCESSOR_API_URL=https://checkout.secure-processorpay.com
SECURE-PROCESSOR_TEST_MODE=false
```

---

## 🎉 SUCCESS INDICATORS

You'll know it's working when:

1. ✅ Vercel deployment completes without errors
2. ✅ Dashboard loads at: https://website-3-hhylc1d5b-vladis-projects-8c520e18.vercel.app/dashboard
3. ✅ No "Application error" message
4. ✅ User token count displays correctly
5. ✅ Payment history page works
6. ✅ No database errors in Vercel logs

---

## 📞 QUICK REFERENCE

**Vercel Project**: https://vercel.com/vladis-projects-8c520e18/website-3  
**Environment Variables**: .../settings/environment-variables  
**Deployments**: .../deployments  
**Logs**: .../logs  

**Neon Console**: https://console.neon.tech  
**Project**: br-muddy-shape-admsxe51  
**Endpoint**: ep-sweet-waterfall-adkazkpm (Active)

---

**Created**: October 14, 2025  
**Status**: ✅ Connection String Verified - Ready to Deploy  
**Action**: Update Vercel environment variables and redeploy  
**Priority**: CRITICAL - Production site down without this fix

