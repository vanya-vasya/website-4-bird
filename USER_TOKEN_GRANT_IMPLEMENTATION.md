# User Token Grant Implementation

## Overview
This implementation grants **15 tokens** to new users upon first sign-up or authentication. The system ensures idempotency and concurrency-safe behavior.

## Key Features

### 1. **Initial Token Grant**
- New users receive exactly **15 tokens** on account creation
- Tokens are credited to `availableGenerations` field
- `usedGenerations` starts at 0
- `initialTokensGranted` flag tracks the bonus

### 2. **Idempotency**
The system prevents duplicate token grants through:
- **Database-level**: `clerkId` unique constraint in Prisma schema
- **Application-level**: `upsert` operation in `createUser` function
- **Tracking**: `initialTokensGranted` boolean flag

### 3. **Concurrency Safety**
Protection against race conditions:
- Prisma's `upsert` provides atomic database operations
- Unique constraint on `clerkId` prevents duplicate records
- Webhook retries/replays safely handled

## Database Schema Changes

```prisma
model User {
  id                   String        @id @default(cuid())
  clerkId              String        @unique        // Ensures uniqueness
  email                String        @unique
  photo                String
  firstName            String?
  lastName             String?
  usedGenerations      Int           @default(0)
  availableGenerations Int           @default(15)    // Changed from 20 to 15
  initialTokensGranted Boolean       @default(true)  // NEW: Tracks token grant
  createdAt            DateTime      @default(now()) // NEW: Timestamp tracking
  updatedAt            DateTime      @updatedAt      // NEW: Timestamp tracking
  transactions         Transaction[]
}
```

## Migration

Run the migration to update your database:

```bash
npx prisma migrate deploy
```

Migration file: `prisma/migrations/20251002_add_initial_tokens_granted_and_timestamps/migration.sql`

## Code Changes

### `lib/actions/user.actions.ts`

The `createUser` function now uses `upsert`:

```typescript
export async function createUser(user: any) {
  try {
    const newUser = await prismadb.user.upsert({
      where: { clerkId: user.clerkId },
      update: {
        // Only update profile fields, NOT tokens
        email: user.email,
        photo: user.photo,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      create: {
        ...user,
        usedGenerations: 0,
        availableGenerations: 15,
        initialTokensGranted: true,
      },
    });
    return newUser;
  } catch (error) {
    console.error("[CREATE_USER_ERROR]", error);
    throw error;
  }
}
```

**Key Points:**
- `upsert` ensures atomic create-or-update
- `update` clause preserves existing token balances
- `create` clause grants exactly 15 tokens to new users
- Errors are logged and re-thrown for proper handling

## Webhook Flow

1. User signs up via Clerk
2. Clerk sends `user.created` webhook
3. Webhook handler calls `createUser()`
4. Database creates user with 15 tokens
5. Clerk metadata updated with internal user ID

**Retry Safety:**
- If webhook is retried, `upsert` finds existing user
- Only profile fields are updated, tokens remain unchanged
- No duplicate token grants occur

## Testing

### Unit Tests
Location: `__tests__/unit/user-initial-tokens.test.ts`

Tests cover:
- ✅ New user receives exactly 15 tokens
- ✅ Duplicate creation doesn't grant additional tokens
- ✅ Concurrent creation attempts are idempotent
- ✅ Error handling and re-throwing
- ✅ Token preservation for existing users
- ✅ Edge cases (zero tokens, purchased tokens)

### Integration Tests
Location: `__tests__/integration/user-signup-tokens.test.tsx`

Tests cover:
- ✅ Complete sign-up flow with 15 tokens
- ✅ Concurrent webhook deliveries
- ✅ Existing user sign-ins don't grant additional tokens
- ✅ Premium users' purchased tokens are preserved
- ✅ Database constraint enforcement
- ✅ Token balance integrity
- ✅ Race conditions and timing issues

### Running Tests

```bash
# Run all token-related tests
npm test -- user-initial-tokens
npm test -- user-signup-tokens

# Run with coverage
npm test -- --coverage
```

## Verification Checklist

- [x] Schema updated with `initialTokensGranted` and timestamps
- [x] Migration created for database changes
- [x] `createUser` uses idempotent `upsert` operation
- [x] Default token value changed from 20 to 15
- [x] Unit tests verify token allocation logic
- [x] Integration tests verify complete flow
- [x] Concurrency safety implemented and tested
- [x] Error handling properly implemented
- [x] Existing users' tokens are preserved

## User Scenarios

### Scenario 1: New User Sign-up
```
User signs up → Webhook fires → createUser() → User created with 15 tokens
```
**Result:** User has 15 available tokens, 0 used

### Scenario 2: Webhook Retry
```
User signs up → Webhook fires → createUser() → User created
Webhook retries → createUser() → User found, profile updated, tokens unchanged
```
**Result:** User still has 15 tokens, no duplicates

### Scenario 3: Existing User Sign-in
```
User signs in (already registered) → getUserById() → Returns existing user
```
**Result:** User's existing token balance preserved (e.g., 3 remaining after using 12)

### Scenario 4: User with Purchased Tokens
```
User has 15 initial + 500 purchased - 50 used = 450 available
Webhook retry → Profile updated, 450 tokens preserved
```
**Result:** User keeps all purchased tokens

## Monitoring & Observability

### Logs to Monitor
```typescript
console.error("[CREATE_USER_ERROR]", error); // User creation failures
```

### Database Queries
```sql
-- Check users with initial tokens granted
SELECT COUNT(*) FROM "User" WHERE "initialTokensGranted" = true;

-- Find users who haven't received initial tokens (should be 0)
SELECT COUNT(*) FROM "User" WHERE "initialTokensGranted" = false;

-- Average token balance
SELECT AVG("availableGenerations") FROM "User";
```

## Rollback Plan

If issues arise:

1. Revert migration:
```bash
npx prisma migrate resolve --rolled-back 20251002_add_initial_tokens_granted_and_timestamps
```

2. Revert code changes in `lib/actions/user.actions.ts`

3. Update default back to 20 in schema if needed

## Future Enhancements

Potential improvements:
- [ ] Add token expiration dates
- [ ] Implement token purchase history
- [ ] Add admin panel for manual token adjustments
- [ ] Create analytics dashboard for token usage
- [ ] Implement token referral bonuses

## Support

For issues or questions:
1. Check test results: `npm test`
2. Review logs for `[CREATE_USER_ERROR]` entries
3. Verify database migrations are applied: `npx prisma migrate status`
4. Check webhook delivery in Clerk dashboard

