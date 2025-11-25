# GBP Pricing System Migration

## Overview

This document details the migration from a **token-based pricing system** to a **GBP-based pricing system** for all transactions in the payment history.

**Migration Date:** October 14, 2025  
**Status:** ✅ Complete

---

## 🎯 Objectives

1. **Unify pricing display**: Show all payment history transactions in GBP (£) instead of mixed "tokens" and "GBP"
2. **Maintain backward compatibility**: Keep token-based credit tracking for user balances
3. **Accurate conversion**: Use consistent conversion rate (1 token = £0.20 = 20 pence)
4. **Reversible migration**: Provide rollback capability via migration script

---

## 💰 Pricing Structure

### Tool Pricing (GBP)

| Tool                     | Tokens | GBP (pence) | GBP (£)  |
|--------------------------|--------|-------------|----------|
| **Your Own Chef**        | 10     | 200         | £2.00    |
| **Your Own Nutritionist**| 15     | 300         | £3.00    |
| **Your Own Tracker**     | 5      | 100         | £1.00    |

### Conversion Rate

```
1 token = £0.20 = 20 pence
```

### Package Pricing

| Package                  | Price  | Tokens | Per Token |
|--------------------------|--------|--------|-----------|
| Your Own Tracker         | £20    | 100    | £0.20     |
| Your Own Chef            | £40    | 220    | £0.18     |
| Your Own Nutritionist    | £60    | 360    | £0.17     |

---

## 🔧 Technical Changes

### 1. API Endpoint Updates (`/api/generate/route.ts`)

#### Before:
```typescript
const TOOL_PRICES: Record<string, number> = {
  'master-chef': 10,           // tokens
  'master-nutritionist': 15,   // tokens
  'cal-tracker': 5,            // tokens
};

// Transaction creation
await tx.transaction.create({
  data: {
    amount: -toolPrice,        // -10 tokens
    currency: 'tokens',
    message: `${toolPrice} tokens deducted for ${toolName}`,
  },
});
```

#### After:
```typescript
// Dual pricing system
const TOOL_PRICES_GBP: Record<string, number> = {
  'master-chef': 200,        // £2.00 in pence
  'master-nutritionist': 300, // £3.00 in pence
  'cal-tracker': 100,        // £1.00 in pence
};

const TOOL_PRICES_TOKENS: Record<string, number> = {
  'master-chef': 10,
  'master-nutritionist': 15,
  'cal-tracker': 5,
};

// Transaction creation
await tx.transaction.create({
  data: {
    amount: -toolPriceGBP,     // -200 pence = -£2.00
    currency: 'GBP',
    message: `£${(toolPriceGBP / 100).toFixed(2)} deducted for ${toolName}`,
  },
});
```

### 2. Payment History UI (`/app/(dashboard)/dashboard/billing/payment-history/page.tsx`)

#### Before:
```tsx
<td>
  {(transaction.amount ?? 0.0) / 100}{" "}
  {transaction.currency}
</td>
```

#### After:
```tsx
<td>
  {(() => {
    const amount = transaction.amount ?? 0;
    const absAmount = Math.abs(amount) / 100;
    const sign = amount < 0 ? '-' : '';
    return `${sign}£${absAmount.toFixed(2)}`;
  })()}
</td>
```

### 3. Migration Script

**Location:** `/scripts/migrate-tokens-to-gbp.ts`

#### Usage:

```bash
# Preview migration (dry run)
npx ts-node scripts/migrate-tokens-to-gbp.ts --dry-run

# Execute migration
npx ts-node scripts/migrate-tokens-to-gbp.ts

# Rollback migration
npx ts-node scripts/migrate-tokens-to-gbp.ts --reverse --dry-run
npx ts-node scripts/migrate-tokens-to-gbp.ts --reverse
```

#### Migration Logic:

1. **Find all transactions with `currency="tokens"`**
2. **Convert amounts**: `tokens × 20 = pence`
3. **Update records**:
   - `amount`: Convert to GBP pence
   - `currency`: Change to "GBP"
   - `message`: Replace "tokens" with "£" format

#### Example:

```typescript
// Before migration
{
  amount: -10,
  currency: 'tokens',
  message: '10 tokens deducted for Your Own Chef'
}

// After migration
{
  amount: -200,           // -10 × 20 = -200 pence = -£2.00
  currency: 'GBP',
  message: '£2.00 deducted for Your Own Chef'
}
```

---

## 📊 Database Schema

### Transaction Model

```prisma
model Transaction {
  id                  String    @id @default(cuid())
  tracking_id         String
  userId              String
  status              String?
  amount              Int?      // GBP in pence (was: tokens)
  currency            String?   // "GBP" (was: "tokens" for deductions)
  description         String?
  type                String?   // "payment" or "deduction"
  payment_method_type String?
  message             String?
  paid_at             DateTime?
  receipt_url         String?
  user                User      @relation(fields: [userId], references: [clerkId])
}
```

**Note:** No schema migration required - the `amount` and `currency` fields already support the new format.

---

## 🔄 Dual Tracking System

The system maintains **dual tracking** during the transition:

### Credit Balance (Tokens)
- **Location:** `User.usedGenerations` and `User.availableGenerations`
- **Purpose:** Credit availability checks, quota management
- **Unit:** Tokens

### Transaction Records (GBP)
- **Location:** `Transaction.amount` and `Transaction.currency`
- **Purpose:** Payment history, audit trail, financial records
- **Unit:** GBP pence

### Why Dual Tracking?

1. **Backward Compatibility:** Existing user balances remain in tokens
2. **Credit Checking:** Token-based checks are simpler (no decimal handling)
3. **Display Consistency:** All payment history shows GBP
4. **Migration Safety:** Can revert to token-based system if needed

---

## ✅ Testing

### Test Coverage

1. **Unit Tests** (`__tests__/payment/gbp-transaction-display.test.tsx`)
   - Amount formatting
   - Currency conversion
   - Transaction type detection
   - Tool-specific pricing
   - Legacy migration logic

2. **Integration Tests** (`__tests__/api/generate-gbp-pricing.test.ts`)
   - API endpoint GBP pricing
   - Transaction record creation
   - Credit balance checks
   - Dual tracking system
   - Edge cases

### Test Execution

```bash
npm test __tests__/payment/gbp-transaction-display.test.tsx
npm test __tests__/api/generate-gbp-pricing.test.ts
```

### Manual Testing Checklist

- [ ] Generate a recipe with "Your Own Chef" (£2.00 deduction)
- [ ] Generate a consultation with "Your Own Nutritionist" (£3.00 deduction)
- [ ] Generate a macro analysis with "Your Own Tracker" (£1.00 deduction)
- [ ] Purchase tokens (shows positive GBP amount)
- [ ] Verify payment history shows all amounts in £
- [ ] Check that credit balance still uses tokens
- [ ] Verify database has correct GBP amounts

---

## 🚀 Deployment Checklist

### Pre-Deployment

- [x] Update API endpoint (`/api/generate/route.ts`)
- [x] Update payment history UI
- [x] Create migration script
- [x] Write comprehensive tests
- [x] Test migration script in staging (dry-run)
- [x] Document changes

### Deployment Steps

1. **Deploy Code Changes**
   ```bash
   git add .
   git commit -m "feat: Migrate payment system from tokens to GBP pricing"
   git push origin production/migrate-to-yum-mi-domain
   ```

2. **Run Migration Script** (Production)
   ```bash
   # Connect to production database
   # Run dry-run first to verify
   npx ts-node scripts/migrate-tokens-to-gbp.ts --dry-run
   
   # If dry-run looks good, execute migration
   npx ts-node scripts/migrate-tokens-to-gbp.ts
   ```

3. **Verify Migration**
   - Check payment history page
   - Verify recent transactions show GBP
   - Confirm database records updated
   - Test new AI generations

4. **Monitor**
   - Watch error logs for any issues
   - Monitor user feedback
   - Check transaction creation logs

### Rollback Plan

If issues arise:

```bash
# Rollback database changes
npx ts-node scripts/migrate-tokens-to-gbp.ts --reverse

# Revert code changes
git revert HEAD
git push origin production/migrate-to-yum-mi-domain
```

---

## 📈 Impact Analysis

### User-Facing Changes

✅ **Improved:**
- Unified payment history display (all in £)
- Clearer pricing transparency
- Professional financial records

⚠️ **No Impact:**
- Credit balance still shown in tokens
- No change to actual pricing
- All existing features work as before

### System Performance

- **Minimal Impact:** No performance degradation expected
- **Database Load:** One-time migration script only
- **API Response Time:** No change (same calculation complexity)

---

## 🔍 Monitoring & Observability

### Key Metrics to Monitor

1. **Transaction Creation Success Rate**
   ```
   [API_GENERATE] ✅ Credits deducted successfully
   ```

2. **Payment History Load Time**
   - Should remain under 500ms

3. **Migration Statistics**
   ```
   Total Processed: X
   Total Updated: Y
   Errors: 0
   ```

### Log Examples

**Successful Deduction:**
```
[API_GENERATE:req_123] N8N successful, deducting 10 tokens (£2.00)
[API_GENERATE:req_123] ✅ Credits deducted successfully: {
  toolPriceTokens: 10,
  toolPriceGBP: '£2.00',
  trackingId: 'usage_master-chef_1729872345678',
  remainingCredits: 40
}
```

**Transaction Record:**
```json
{
  "tracking_id": "usage_master-chef_1729872345678",
  "amount": -200,
  "currency": "GBP",
  "description": "Your Own Chef - AI Generation",
  "message": "£2.00 deducted for Your Own Chef"
}
```

---

## 🎓 Developer Guide

### Adding New Tools

When adding a new AI tool:

1. **Define pricing in both formats:**
   ```typescript
   const TOOL_PRICES_GBP: Record<string, number> = {
     // ... existing tools
     'new-tool': 150, // £1.50 in pence
   };

   const TOOL_PRICES_TOKENS: Record<string, number> = {
     // ... existing tools
     'new-tool': 7.5, // tokens (150 ÷ 20)
   };
   ```

2. **Add tool name:**
   ```typescript
   const TOOL_NAMES: Record<string, string> = {
     // ... existing tools
     'new-tool': 'Your New Tool',
   };
   ```

3. **Verify conversion rate:**
   ```typescript
   // 1 token = 20 pence
   TOOL_PRICES_GBP['new-tool'] === TOOL_PRICES_TOKENS['new-tool'] * 20
   ```

### Formatting Amounts

**Always use this helper function:**

```typescript
function formatGBP(pence: number): string {
  const pounds = Math.abs(pence) / 100;
  const sign = pence < 0 ? '-' : '';
  return `${sign}£${pounds.toFixed(2)}`;
}
```

**Examples:**
```typescript
formatGBP(200)   // "£2.00"
formatGBP(-300)  // "-£3.00"
formatGBP(50)    // "£0.50"
```

---

## 📋 Change Summary

### Files Modified

| File | Change Type | Description |
|------|-------------|-------------|
| `app/api/generate/route.ts` | Modified | Added GBP pricing, dual tracking |
| `app/(dashboard)/dashboard/billing/payment-history/page.tsx` | Modified | Updated amount display to GBP |
| `scripts/migrate-tokens-to-gbp.ts` | New | Migration script |
| `__tests__/payment/gbp-transaction-display.test.tsx` | New | Display tests |
| `__tests__/api/generate-gbp-pricing.test.ts` | New | API tests |
| `GBP_PRICING_MIGRATION.md` | New | This document |

### Database Changes

- No schema changes required
- Existing `amount` field changed from tokens to pence
- Existing `currency` field changed from "tokens" to "GBP" for deductions

### API Changes

- **Backward Compatible:** Old token-based transactions still readable
- **Response Format:** Unchanged (no breaking changes)
- **New Behavior:** All new transactions created in GBP

---

## 🆘 Troubleshooting

### Issue: Payment history shows mixed currencies

**Cause:** Migration script not run yet  
**Solution:**
```bash
npx ts-node scripts/migrate-tokens-to-gbp.ts
```

### Issue: Deductions not showing in GBP

**Cause:** Using old code version  
**Solution:** Deploy latest changes and restart server

### Issue: Credit balance incorrect after migration

**Cause:** Migration only affects Transaction records, not User.availableGenerations  
**Solution:** This is expected - credit balance remains in tokens

### Issue: Negative amounts not displaying correctly

**Cause:** Missing sign handling in display logic  
**Solution:** Ensure using the updated payment history UI code

---

## 📞 Support

For questions or issues:
- Check logs: `[API_GENERATE]` and `[WEBHOOK]` prefixes
- Review test files for examples
- Contact: vladimir.serushko@gmail.com

---

## ✅ Migration Complete

**Date:** October 14, 2025  
**Status:** ✅ Production Ready  
**Rollback Available:** Yes  
**Tests Passing:** Yes  
**Documentation Complete:** Yes

---

**Last Updated:** October 14, 2025  
**Version:** 1.0.0  
**Author:** Senior Front-End Developer

