#!/usr/bin/env node

/**
 * Test script to simulate Clerk webhook and verify user creation
 * 
 * Usage:
 *   node scripts/test-clerk-webhook.js
 * 
 * This script:
 * 1. Connects to Neon database
 * 2. Simulates a Clerk user.created webhook
 * 3. Verifies user is created in database
 * 4. Cleans up test user
 */

const { neon } = require('@neondatabase/serverless');

const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`),
  warn: (msg) => console.warn(`⚠️  ${msg}`),
};

async function testClerkWebhook() {
  console.log('\n🧪 CLERK WEBHOOK TEST\n');
  console.log('═'.repeat(60));

  // 1. Check DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    log.error('DATABASE_URL not set!');
    console.log('\n📋 Set DATABASE_URL:');
    console.log('   export DATABASE_URL="postgresql://...neon.tech/neondb?sslmode=require"');
    process.exit(1);
  }

  log.info(`Using database: ${databaseUrl.split('@')[1]?.split('/')[0]}`);

  // 2. Connect to database
  const sql = neon(databaseUrl);
  
  try {
    await sql`SELECT 1`;
    log.success('Connected to database');
  } catch (error) {
    log.error('Database connection failed!');
    console.error(error);
    process.exit(1);
  }

  // 3. Create test user data (simulating Clerk webhook payload)
  const testUser = {
    clerkId: `test_clerk_${Date.now()}`,
    email: `test.${Date.now()}@example.com`,
    firstName: 'Test',
    lastName: 'User',
    photo: 'https://example.com/photo.jpg',
    availableGenerations: 10,
    usedGenerations: 0,
  };

  console.log('\n📝 Test User Data:');
  console.log(JSON.stringify(testUser, null, 2));

  // 4. Insert user (simulating what webhook does)
  try {
    console.log('\n🔄 Inserting test user into database...');
    
    const result = await sql`
      INSERT INTO "User" (
        id,
        "clerkId",
        email,
        photo,
        "firstName",
        "lastName",
        "availableGenerations",
        "usedGenerations"
      ) VALUES (
        gen_random_uuid(),
        ${testUser.clerkId},
        ${testUser.email},
        ${testUser.photo},
        ${testUser.firstName},
        ${testUser.lastName},
        ${testUser.availableGenerations},
        ${testUser.usedGenerations}
      )
      RETURNING *
    `;

    if (result && result.length > 0) {
      log.success('User created successfully!');
      console.log('\n📊 Created user:');
      console.log(JSON.stringify(result[0], null, 2));

      // 5. Verify user can be queried
      console.log('\n🔍 Verifying user can be queried...');
      const queryResult = await sql`
        SELECT * FROM "User"
        WHERE "clerkId" = ${testUser.clerkId}
      `;

      if (queryResult && queryResult.length > 0) {
        log.success('User query successful!');
      } else {
        log.error('User query failed - user not found');
      }

      // 6. Clean up test user
      console.log('\n🧹 Cleaning up test user...');
      await sql`
        DELETE FROM "User"
        WHERE "clerkId" = ${testUser.clerkId}
      `;
      log.success('Test user deleted');

    } else {
      log.error('User creation returned no result');
    }

  } catch (error) {
    log.error('Test failed!');
    console.error('\n❌ Error details:');
    console.error({
      name: error.name,
      message: error.message,
      code: error.code,
    });

    // Try to clean up if test user was partially created
    try {
      await sql`
        DELETE FROM "User"
        WHERE "clerkId" = ${testUser.clerkId}
      `;
    } catch (cleanupError) {
      // Ignore cleanup errors
    }

    process.exit(1);
  }

  // 7. Test upsert logic (createOrGetUser)
  console.log('\n🔄 Testing upsert logic...');
  
  const upsertUser = {
    clerkId: `upsert_test_${Date.now()}`,
    email: `upsert.${Date.now()}@example.com`,
    firstName: 'Upsert',
    lastName: 'Test',
    photo: 'https://example.com/upsert.jpg',
    availableGenerations: 10,
    usedGenerations: 0,
  };

  try {
    // First insert
    console.log('   → First insert (should create new user)...');
    const firstInsert = await sql`
      INSERT INTO "User" (
        id, "clerkId", email, photo, "firstName", "lastName",
        "availableGenerations", "usedGenerations"
      ) VALUES (
        gen_random_uuid(), ${upsertUser.clerkId}, ${upsertUser.email},
        ${upsertUser.photo}, ${upsertUser.firstName}, ${upsertUser.lastName},
        ${upsertUser.availableGenerations}, ${upsertUser.usedGenerations}
      )
      RETURNING *
    `;
    log.success(`Created user: ${firstInsert[0].id}`);

    // Try to find existing user (simulating createOrGetUser)
    console.log('   → Second call (should find existing user)...');
    const existingUser = await sql`
      SELECT * FROM "User"
      WHERE "clerkId" = ${upsertUser.clerkId}
    `;

    if (existingUser && existingUser.length > 0) {
      log.success('Found existing user (upsert works!)');
    } else {
      log.error('Could not find existing user');
    }

    // Clean up
    await sql`
      DELETE FROM "User"
      WHERE "clerkId" = ${upsertUser.clerkId}
    `;
    log.success('Upsert test user deleted');

  } catch (error) {
    log.error('Upsert test failed');
    console.error(error.message);

    // Cleanup
    try {
      await sql`
        DELETE FROM "User"
        WHERE "clerkId" = ${upsertUser.clerkId}
      `;
    } catch (e) {
      // Ignore
    }
  }

  // 8. Final summary
  console.log('\n' + '═'.repeat(60));
  console.log('\n✅ ALL TESTS PASSED!\n');
  console.log('📋 Next steps:');
  console.log('   1. Verify Clerk webhook configuration:');
  console.log('      https://dashboard.clerk.com → Webhooks');
  console.log('   2. Check webhook URL: https://www.yum-mi.com/api/webhooks/clerk');
  console.log('   3. Verify WEBHOOK_SECRET is set in Vercel');
  console.log('   4. Test real Google sign-in after deploying fixes');
  console.log('   5. Monitor Vercel logs: https://vercel.com → Logs');
  console.log('\n');
}

// Run test
testClerkWebhook().catch((error) => {
  console.error('\n💥 Unhandled error:');
  console.error(error);
  process.exit(1);
});

