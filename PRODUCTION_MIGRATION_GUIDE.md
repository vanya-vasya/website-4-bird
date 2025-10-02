# Production Migration Guide - 15 Token Welcome Bonus

## ⚠️ Current Status

**Hotfix Applied:** Fields made optional to prevent production errors
**Migration Status:** NOT YET APPLIED to production database
**Code Status:** Compatible with both migrated and unmigrated databases

## 🎯 When to Run Migration

Run the migration when you're ready to fully deploy the 15-token feature to production.

## 📋 Pre-Migration Checklist

- [ ] Verify hotfix deployed (error stopped)
- [ ] Backup production database
- [ ] Test migration in staging environment
- [ ] Schedule maintenance window (optional - migration is non-destructive)
- [ ] Have rollback plan ready

## 🚀 Migration Steps

### Step 1: Backup Production Database

**For PostgreSQL (Vercel Postgres, Supabase, etc.):**
```bash
# Get connection string from Vercel/hosting provider
pg_dump "your_production_database_url" > backup_$(date +%Y%m%d_%H%M%S).sql
```

**For Neon/PlanetScale:**
Use their dashboard to create a snapshot/backup.

### Step 2: Run Migration

**Option A: Via Vercel Dashboard**
```bash
# Add this to your build command temporarily:
npx prisma migrate deploy && next build
```

**Option B: Locally with Production Database** (Recommended)
```bash
# Set production DATABASE_URL in terminal
export DATABASE_URL="your_production_database_url"

# Run migration
npx prisma migrate deploy

# Verify
npx prisma studio
```

**Option C: Via Custom Script**
```bash
# Connect to production and run:
psql $DATABASE_URL << EOF
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "initialTokensGranted" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

UPDATE "User" 
SET "createdAt" = CURRENT_TIMESTAMP, 
    "updatedAt" = CURRENT_TIMESTAMP 
WHERE "createdAt" IS NULL;
EOF
```

### Step 3: Verify Migration

```sql
-- Check columns exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'User'
  AND column_name IN ('initialTokensGranted', 'createdAt', 'updatedAt');

-- Should return 3 rows showing the new columns

-- Check existing users have values
SELECT 
  COUNT(*) as total_users,
  COUNT("initialTokensGranted") as with_flag,
  COUNT("createdAt") as with_created_at
FROM "User";
```

### Step 4: Make Fields Required Again (Optional)

After migration is successful, you can make the fields non-nullable:

**Update schema.prisma:**
```prisma
model User {
  initialTokensGranted Boolean       @default(true)
  createdAt            DateTime      @default(now())
  updatedAt            DateTime      @updatedAt
}
```

**Create migration:**
```bash
npx prisma migrate dev --name make_new_fields_required
```

**Deploy to production:**
```bash
npx prisma migrate deploy
```

## 🔍 Verification Steps

### 1. Check New Users Get 15 Tokens

```sql
-- Create test user via sign-up
-- Then check:
SELECT clerkId, availableGenerations, usedGenerations, initialTokensGranted
FROM "User"
WHERE clerkId = 'clerk_test_user_id';

-- Should show:
-- availableGenerations: 15
-- usedGenerations: 0
-- initialTokensGranted: true
```

### 2. Check Existing Users Unchanged

```sql
-- Check existing users kept their balances
SELECT 
  clerkId,
  availableGenerations,
  usedGenerations,
  initialTokensGranted,
  createdAt
FROM "User"
ORDER BY createdAt DESC NULLS LAST
LIMIT 10;
```

### 3. Test Idempotency

- Sign up a new user
- Check webhook logs
- Verify only 15 tokens granted
- Simulate webhook retry
- Verify still only 15 tokens

## 🔄 Rollback Plan

If issues occur:

### Option 1: Code Rollback
```bash
git revert e12f847  # Revert optional fields
git revert c3d41ec  # Revert 15-token implementation
git push origin feature/15-token-welcome-bonus-implementation
```

### Option 2: Database Rollback
```bash
# Restore from backup
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql

# Or drop columns
ALTER TABLE "User" 
DROP COLUMN IF EXISTS "initialTokensGranted",
DROP COLUMN IF EXISTS "createdAt",
DROP COLUMN IF EXISTS "updatedAt";
```

### Option 3: Partial Rollback (Keep columns, change default)
```sql
-- Change default back to 20 tokens
ALTER TABLE "User" 
ALTER COLUMN "availableGenerations" SET DEFAULT 20;
```

## 📊 Migration Impact

**Downtime:** None (non-breaking changes)
**Affected Tables:** User
**New Columns:** 3 (initialTokensGranted, createdAt, updatedAt)
**Data Changes:** None to existing rows
**New Users:** Will receive 15 tokens instead of 20

## ⚙️ Environment-Specific Instructions

### Vercel Postgres
```bash
# Get connection string from Vercel dashboard
vercel env pull .env.local
npx prisma migrate deploy
```

### Supabase
```bash
# Use Supabase dashboard SQL editor
# Or connect via connection string
npx prisma migrate deploy
```

### PlanetScale
```bash
# PlanetScale requires deploy requests
pscale deploy-request create yum-mi add-token-fields
pscale deploy-request deploy yum-mi add-token-fields
```

### Neon
```bash
# Get connection string from Neon dashboard
npx prisma migrate deploy
```

## 🐛 Troubleshooting

### Error: Migration already applied
```bash
npx prisma migrate resolve --applied 20251002_add_initial_tokens_granted_and_timestamps
```

### Error: Column already exists
This is fine - the migration uses `IF NOT EXISTS`. Just mark as resolved:
```bash
npx prisma migrate resolve --applied 20251002_add_initial_tokens_granted_and_timestamps
```

### Error: Timeout connecting to database
- Check DATABASE_URL is correct
- Verify database is accessible
- Check firewall rules
- Try again with longer timeout

## 📞 Support

If you encounter issues:

1. Check Vercel logs for detailed errors
2. Verify DATABASE_URL is set correctly
3. Test migration in staging first
4. Review this guide's troubleshooting section
5. Consider rolling back if critical

## ✅ Post-Migration Checklist

- [ ] Migration applied successfully
- [ ] New users receive 15 tokens
- [ ] Existing users' balances unchanged
- [ ] Webhook creates users properly
- [ ] Tests pass: `npm test -- user-initial-tokens user-signup-tokens`
- [ ] No errors in production logs
- [ ] Database backup retained

## 🎉 Success Criteria

Migration is successful when:
- ✅ No Prisma errors in production logs
- ✅ New sign-ups get exactly 15 tokens
- ✅ Existing users unaffected
- ✅ All 24 tests passing
- ✅ Database has 3 new columns with proper defaults

