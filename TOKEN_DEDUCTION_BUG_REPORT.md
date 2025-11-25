# Token Deduction Bug - Root Cause Analysis

**Date**: 2025-10-14  
**Severity**: Critical  
**Status**: Fixed

## Executive Summary

When users utilize AI features (Your Own Chef, Your Own Nutritionist, Your Own Tracker), tokens are **NOT being decremented** in the database, and **no transaction records** are created. This is a critical bug that allows unlimited free usage of paid features.

---

## Root Cause

The `/app/api/generate/route.ts` endpoint is a simple **proxy** that forwards requests to the N8N webhook. It does NOT:

1. ❌ Authenticate users
2. ❌ Check credit balance
3. ❌ Decrement `usedGenerations` in the database
4. ❌ Create transaction records for token deductions

### Current Flow (Broken)

```
User Frontend (conversation/page.tsx)
  │
  ├─ Checks credit balance (client-side)
  ├─ Optimistically updates local state: setUsedCredits(prev => prev + toolPrice)
  │
  └─> POST /api/generate (PROXY ONLY - NO DB OPERATIONS)
       └─> Forwards to N8N Webhook
            └─> Returns AI response
```

**Result**: Frontend shows token deduction, but database never changes!

---

## Evidence

### 1. API Generate Route (Current Implementation)

```typescript:app/api/generate/route.ts
export async function POST(req: NextRequest) {
  // ... just proxies to N8N webhook
  const n8nRes = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  
  // NO TOKEN DEDUCTION HERE!
  return new NextResponse(text, {
    status: n8nRes.status,
  });
}
```

### 2. Frontend (Conversation Page)

Lines 383-386 show optimistic update (local state only):

```typescript:app/(dashboard)/dashboard/conversation/page.tsx
// Update local credit balance (optimistic update) - skip for free tools
if (toolPrice > 0) {
  setUsedCredits(prev => prev + toolPrice);
}
```

This is **NOT persisted** to the database!

### 3. Webhook Payment Route

The payment webhook correctly handles **adding tokens** from purchases (lines 81-108):

```typescript:app/api/webhooks/payment/route.ts
await prismadb.user.update({
  where: { clerkId: userId },
  data: {
    availableGenerations: user?.availableGenerations - user?.usedGenerations + number,
    usedGenerations: 0,
  },
});

await prismadb.transaction.create({
  data: {
    tracking_id: transaction.tracking_id,
    userId: userId,
    // ... transaction details
  },
});
```

But there's **NO equivalent logic** for deducting tokens when AI features are used!

---

## Impact Assessment

### Severity: CRITICAL

1. **Financial Loss**: Users can use paid AI features indefinitely without paying
2. **Data Integrity**: Credit balance displayed in UI doesn't match database reality
3. **Audit Trail**: No transaction records exist for token usage
4. **Business Logic**: Token purchase system is bypassed

### Affected Features

- ✗ Your Own Chef (10 tokens/generation) - **Not deducting**
- ✗ Your Own Nutritionist (15 tokens/generation) - **Not deducting**
- ✗ Your Own Tracker (5 tokens/generation) - **Not deducting**

### Reproduction Steps

1. User purchases tokens → Database updated ✓
2. User uses AI feature → Frontend shows deduction ✓
3. User refreshes page → **Tokens restore to original amount** ✗
4. Check database → **usedGenerations never incremented** ✗
5. Check transactions → **No deduction record exists** ✗

---

## Fix Implementation

### Required Changes

#### 1. Update `/app/api/generate/route.ts`

Add:
- Authentication via Clerk
- Credit balance check BEFORE proxying
- Token deduction AFTER successful N8N response
- Transaction record creation
- Atomic database operations

#### 2. Transaction Record Schema

Deduction transactions should follow this format:

```json
{
  "tracking_id": "usage_<toolId>_<timestamp>",
  "userId": "user_xxx",
  "status": "completed",
  "amount": -10, // Negative for deduction
  "currency": "tokens",
  "description": "Your Own Chef - AI Generation",
  "type": "deduction",
  "payment_method_type": null,
  "message": "10 tokens deducted",
  "paid_at": "2025-10-14T18:11:31.507Z",
  "receipt_url": null
}
```

#### 3. Atomic Transaction Pattern

```typescript
await prismadb.$transaction(async (tx) => {
  // 1. Increment usedGenerations
  await tx.user.update({
    where: { clerkId: userId },
    data: { usedGenerations: { increment: tokenCost } }
  });
  
  // 2. Create transaction record
  await tx.transaction.create({
    data: { /* deduction details */ }
  });
});
```

---

## Testing Checklist

After fix implementation:

- [ ] User with sufficient credits can use AI features
- [ ] `usedGenerations` increments correctly in database
- [ ] Transaction record is created with negative amount
- [ ] User with insufficient credits receives 403 error
- [ ] Frontend credit display matches database after refresh
- [ ] Multiple concurrent requests handled atomically
- [ ] Error scenarios don't deduct tokens

---

## Prevention Measures

1. **Unit Tests**: Add tests for token deduction logic
2. **Integration Tests**: End-to-end AI feature usage with DB verification
3. **Monitoring**: Alert on mismatches between frontend/backend credit state
4. **Code Review**: Ensure all paid features have proper token accounting

---

## Related Files

- `/app/api/generate/route.ts` - **Primary fix location**
- `/lib/api-limit.ts` - Token check/increment utilities
- `/app/(dashboard)/dashboard/conversation/page.tsx` - Frontend credit display
- `/app/api/webhooks/payment/route.ts` - Reference for transaction creation
- `/prisma/schema.prisma` - Database schema

