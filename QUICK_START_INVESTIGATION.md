# 🚀 Quick Start: Investigate Missing User

**Target User**: vladimir.serushko.gmail.com  
**Issue**: User not found in Neon database  
**Time Required**: 5-10 minutes

---

## ⚡ Fast Track (3 Steps)

### Step 1: Get Production Database URL

**Option A - Vercel CLI** (Fastest):
```bash
cd /Users/vladi/Documents/Projects/webapps/yum-mi
./scripts/get-production-db-url.sh
```

**Option B - Manual** (If no Vercel CLI):
1. Go to: https://vercel.com/vladis-projects-8c520e18/website-3/settings/environment-variables
2. Find `DATABASE_URL` variable
3. Copy its value (looks like `postgresql://...neon.tech/...`)

---

### Step 2: Run Investigation

```bash
cd /Users/vladi/Documents/Projects/webapps/yum-mi

# Replace URL with your actual DATABASE_URL from Step 1
DATABASE_URL="postgresql://username:password@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require" \
  node scripts/investigate-neon-user.js
```

---

### Step 3: Review Output

The script will show:

**If User Found** ✅:
```
✅ USER FOUND with email: vladimir.serushko@gmail.com
[User details shown]
```
→ User exists, no action needed!

**If User NOT Found** ❌:
```
❌ User NOT found with any email variant

Possible reasons:
   1. User never completed signup in Clerk
   2. Clerk webhook failed during user creation
   3. Email normalization issue
   ...
```
→ Follow recommended actions shown in output

---

## 🔍 Common Issues & Quick Fixes

### Issue: "DATABASE_URL not set"

**Fix**: You need to pass the DATABASE_URL. Use:
```bash
DATABASE_URL="your-url-here" node scripts/investigate-neon-user.js
```

### Issue: "Database connection timeout"

**Fix**: Neon free tier database is sleeping. Wait 10 seconds and try again.

### Issue: "Authentication failed"

**Fix**: DATABASE_URL password might be wrong. Get fresh URL from Vercel or Neon console.

---

## 📚 Full Documentation

For comprehensive investigation guide, see:
- **Investigation Guide**: `NEON_USER_INVESTIGATION_GUIDE.md`
- **Full Report**: `USER_INVESTIGATION_REPORT.md`

---

## 🆘 Need Help?

**Can't find DATABASE_URL?**
```bash
# Check Vercel
vercel env pull .env.production
cat .env.production | grep DATABASE_URL
```

**Script not working?**
```bash
# Verify Node.js is installed
node --version  # Should show v16 or higher

# Install dependencies
npm install
```

**User exists in Clerk but not database?**
1. Check Clerk Dashboard: https://dashboard.clerk.com
2. Find user → Edit → Change any field → Save
3. This triggers webhook to sync user to database
4. Run investigation again after 30 seconds

---

## ✅ Quick Checklist

Before investigating, ensure you have:
- [ ] Production DATABASE_URL from Vercel
- [ ] Node.js installed (check: `node --version`)
- [ ] Project dependencies installed (check: `npm install`)
- [ ] Internet connection (to reach Neon database)

---

**Created**: October 14, 2025  
**Estimated Time**: 5-10 minutes  
**Difficulty**: Easy

