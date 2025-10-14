#!/usr/bin/env node
/**
 * DIAGNOSTIC SCRIPT: Missing Test Transaction Records Investigation
 * 
 * This script investigates why test payments from Networks are not appearing
 * in the Neon Console Database after successful webhook processing.
 * 
 * Investigation Areas:
 * 1. Environment configuration (test vs production mode)
 * 2. Database connectivity and schema validation
 * 3. Webhook delivery and processing logs
 * 4. Transaction records analysis
 * 5. Networks API configuration
 * 
 * Usage:
 *   DATABASE_URL="postgresql://..." node scripts/diagnose-test-transactions.js
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
};

const log = {
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${'═'.repeat(70)}${colors.reset}`),
  title: (msg) => console.log(`${colors.bright}${colors.cyan}${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.bright}${colors.yellow}▶ ${msg}${colors.reset}`),
  success: (msg) => console.log(`  ${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`  ${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`  ${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`  ${colors.blue}ℹ️  ${msg}${colors.reset}`),
  data: (label, data, indent = '    ') => console.log(`${indent}${colors.magenta}${label}:${colors.reset} ${data}`),
  json: (data) => console.log(`${colors.dim}${JSON.stringify(data, null, 2)}${colors.reset}`),
  divider: () => console.log(`${colors.dim}${'─'.repeat(70)}${colors.reset}`),
};

// Environment variables to check
const ENV_VARS = {
  server: [
    { key: 'DATABASE_URL', required: true, sensitive: true },
    { key: 'NETWORX_SHOP_ID', required: true, sensitive: false },
    { key: 'NETWORX_SECRET_KEY', required: true, sensitive: true },
    { key: 'NETWORX_API_URL', required: true, sensitive: false },
    { key: 'NETWORX_TEST_MODE', required: true, sensitive: false },
  ],
  client: [
    { key: 'NEXT_PUBLIC_NETWORX_SHOP_ID', required: false, sensitive: false },
    { key: 'NEXT_PUBLIC_NETWORX_TEST_MODE', required: false, sensitive: false },
    { key: 'NEXT_PUBLIC_NETWORX_WIDGET_URL', required: false, sensitive: false },
  ],
};

// Mock test webhook payload for testing
const createTestWebhookPayload = (userId, amount, tokens, status = 'completed') => ({
  checkout: {
    token: `test_token_${Date.now()}`,
    status: status,
    order: {
      tracking_id: userId,
      amount: amount,
      currency: 'USD',
      description: `Payment for ${tokens} Tokens (${tokens} Tokens)`,
    },
    customer: {
      email: 'test@example.com',
    },
    transaction: {
      type: 'payment',
      payment_method_type: 'credit_card',
      message: 'Payment successful',
      paid_at: new Date().toISOString(),
      receipt_url: null,
    },
  },
});

async function runDiagnostics() {
  log.header();
  log.title('🔬 NETWORKS TEST TRANSACTION INVESTIGATION');
  log.header();
  
  const results = {
    environment: { status: 'pending', issues: [] },
    database: { status: 'pending', issues: [] },
    transactions: { status: 'pending', issues: [] },
    webhookConfig: { status: 'pending', issues: [] },
    recommendations: [],
  };
  
  // ============================================================================
  // STEP 1: Environment Configuration Check
  // ============================================================================
  log.section('1. Environment Configuration Analysis');
  
  try {
    // Check DATABASE_URL
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      log.error('DATABASE_URL is not set');
      results.environment.issues.push('DATABASE_URL missing');
      results.recommendations.push('Set DATABASE_URL to your Neon production database connection string');
    } else {
      const maskedUrl = databaseUrl.replace(/:[^:@]+@/, ':****@');
      const isNeon = databaseUrl.includes('neon.tech');
      const isLocal = databaseUrl.includes('localhost') || databaseUrl.startsWith('file:');
      
      log.success('DATABASE_URL is configured');
      log.data('Type', isNeon ? 'Neon PostgreSQL (Production)' : isLocal ? 'Local Database' : 'PostgreSQL');
      log.data('Connection', maskedUrl);
      
      if (isLocal) {
        results.environment.issues.push('Using LOCAL database, not production Neon database');
        results.recommendations.push('Switch to production Neon DATABASE_URL to see production transactions');
      }
      
      // Extract Neon endpoint info
      if (isNeon) {
        const match = databaseUrl.match(/ep-([a-z0-9-]+)/);
        if (match) {
          log.data('Neon Endpoint', match[0]);
        }
      }
    }
    
    log.divider();
    
    // Check Networks configuration
    const networxShopId = process.env.NETWORX_SHOP_ID || '29959';
    const networxSecretKey = process.env.NETWORX_SECRET_KEY || 'dbfb6f4e977f49880a6ce3c939f1e7be645a5bb2596c04d9a3a7b32d52378950';
    const networxApiUrl = process.env.NETWORX_API_URL || 'https://checkout.networxpay.com';
    const networxTestMode = process.env.NETWORX_TEST_MODE || 'false';
    
    log.info('Networks Configuration:');
    log.data('Shop ID', networxShopId);
    log.data('Secret Key', networxSecretKey ? `${networxSecretKey.slice(0, 10)}...${networxSecretKey.slice(-10)}` : 'MISSING');
    log.data('API URL', networxApiUrl);
    log.data('Test Mode', networxTestMode);
    
    // Critical check: Test mode status
    if (networxTestMode === 'true') {
      log.warning('NETWORX_TEST_MODE is set to TRUE (test/sandbox mode)');
      log.info('Test mode transactions use test API keys and test payment methods');
      results.environment.issues.push('Running in TEST MODE - test transactions expected');
    } else {
      log.success('NETWORX_TEST_MODE is set to FALSE (production mode)');
      log.info('Production mode transactions use real payment methods');
    }
    
    // Check webhook URL configuration
    const webhookUrl = 'https://www.yum-mi.com/api/webhooks/networx'; // Hardcoded in code
    log.data('Webhook URL', webhookUrl);
    log.info('Webhook URL is hardcoded in app/api/payment/networx/route.ts:53');
    
    log.divider();
    
    // Check client-side variables
    log.info('Client-side Configuration:');
    ENV_VARS.client.forEach(({ key }) => {
      const value = process.env[key];
      if (value) {
        log.data(key, value);
      } else {
        log.warning(`${key} not set (optional)`);
      }
    });
    
    results.environment.status = results.environment.issues.length === 0 ? 'passed' : 'warning';
    
  } catch (error) {
    log.error(`Environment check failed: ${error.message}`);
    results.environment.status = 'failed';
    results.environment.issues.push(error.message);
  }
  
  // ============================================================================
  // STEP 2: Database Connectivity & Schema Validation
  // ============================================================================
  log.section('2. Database Connectivity & Schema Validation');
  
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    log.error('Cannot connect to database - DATABASE_URL not set');
    log.info('Export DATABASE_URL from Vercel or Neon Console:');
    log.info('  Vercel: vercel env pull .env.local');
    log.info('  Neon: https://console.neon.tech > Connection String');
    results.database.status = 'failed';
    results.database.issues.push('DATABASE_URL not configured');
  } else {
    const prisma = new PrismaClient({
      datasources: {
        db: { url: databaseUrl },
      },
    });
    
    try {
      // Test connection
      await prisma.$queryRaw`SELECT 1`;
      log.success('Database connection established');
      
      // Check if tables exist
      try {
        const userCount = await prisma.user.count();
        const transactionCount = await prisma.transaction.count();
        
        log.success('Database schema validated');
        log.data('Total Users', userCount);
        log.data('Total Transactions', transactionCount);
        
        // Check for recent transactions
        const recentTransactions = await prisma.transaction.findMany({
          take: 5,
          orderBy: { paid_at: 'desc' },
          select: {
            id: true,
            tracking_id: true,
            status: true,
            amount: true,
            currency: true,
            description: true,
            paid_at: true,
          },
        });
        
        if (recentTransactions.length === 0) {
          log.warning('No transactions found in database');
          results.database.issues.push('Zero transactions in database');
          results.recommendations.push('Check if webhooks are being delivered to the correct endpoint');
        } else {
          log.success(`Found ${recentTransactions.length} recent transactions`);
          log.divider();
          log.info('Most recent transactions:');
          recentTransactions.forEach((tx, index) => {
            console.log(`\n    ${index + 1}. Transaction ID: ${tx.id.slice(-12)}`);
            log.data('  Tracking ID', tx.tracking_id, '      ');
            log.data('  Status', tx.status, '      ');
            log.data('  Amount', `${tx.amount / 100} ${tx.currency}`, '      ');
            log.data('  Description', tx.description, '      ');
            log.data('  Paid At', tx.paid_at ? tx.paid_at.toISOString() : 'null', '      ');
          });
        }
        
        log.divider();
        
        // Check for test transactions (by description pattern or status)
        const testTransactions = await prisma.transaction.findMany({
          where: {
            OR: [
              { description: { contains: 'test', mode: 'insensitive' } },
              { tracking_id: { contains: 'test', mode: 'insensitive' } },
            ],
          },
          orderBy: { paid_at: 'desc' },
        });
        
        log.info(`Test transactions (with 'test' in description/tracking): ${testTransactions.length}`);
        
        if (testTransactions.length === 0) {
          log.warning('No test transactions found in database');
          results.database.issues.push('No test transactions in database');
          results.recommendations.push('Trigger a test payment and verify webhook delivery');
        } else {
          log.success(`Found ${testTransactions.length} test transactions`);
        }
        
        results.database.status = results.database.issues.length === 0 ? 'passed' : 'warning';
        
      } catch (schemaError) {
        log.error(`Schema validation failed: ${schemaError.message}`);
        results.database.status = 'failed';
        results.database.issues.push('Database schema invalid or tables missing');
        results.recommendations.push('Run: npx prisma db push to sync schema');
      }
      
      await prisma.$disconnect();
      
    } catch (connectionError) {
      log.error(`Database connection failed: ${connectionError.message}`);
      results.database.status = 'failed';
      results.database.issues.push('Cannot connect to database');
      results.recommendations.push('Verify DATABASE_URL is correct and network is accessible');
    }
  }
  
  // ============================================================================
  // STEP 3: Webhook Configuration Analysis
  // ============================================================================
  log.section('3. Webhook Configuration Analysis');
  
  log.info('Webhook Handler: app/api/webhooks/networx/route.ts');
  log.data('Endpoint URL', 'https://www.yum-mi.com/api/webhooks/networx');
  log.data('Configured in', 'app/api/payment/networx/route.ts:53 (hardcoded)');
  
  log.divider();
  log.info('Webhook Processing Flow:');
  console.log('    1. Networks sends POST request to webhook URL');
  console.log('    2. Webhook handler extracts checkout data from body.checkout');
  console.log('    3. Handler validates status (completed/success)');
  console.log('    4. Handler checks for duplicate transactions (idempotency)');
  console.log('    5. Handler validates user exists in database');
  console.log('    6. Handler extracts token count from description');
  console.log('    7. Handler updates user token balance');
  console.log('    8. Handler saves transaction to database');
  console.log('    9. Handler sends receipt email');
  console.log('    10. Handler returns 200 OK to Networks');
  
  log.divider();
  log.warning('Critical Points of Failure:');
  console.log('    • If Networks sends webhooks to wrong URL → No webhook received');
  console.log('    • If status is not "completed" or "success" → No DB write');
  console.log('    • If user not found in database → Returns 404, no DB write');
  console.log('    • If description format wrong → Returns 400, no DB write');
  console.log('    • If duplicate transaction → Returns 200 but no DB write (idempotency)');
  
  // Check webhook signature validation
  const secretKey = process.env.NETWORX_SECRET_KEY || 'dbfb6f4e977f49880a6ce3c939f1e7be645a5bb2596c04d9a3a7b32d52378950';
  log.divider();
  log.info('Webhook Security:');
  log.data('Signature Validation', 'DISABLED in code (commented out)');
  log.warning('Webhook handler does NOT validate signatures (line 63-64)');
  log.info('Instead, validates by checking token against database');
  
  results.webhookConfig.status = 'passed';
  
  // ============================================================================
  // STEP 4: Test Mode vs Production Mode Analysis
  // ============================================================================
  log.section('4. Test Mode vs Production Mode Analysis');
  
  const testMode = process.env.NETWORX_TEST_MODE === 'true';
  
  log.data('Current Mode', testMode ? 'TEST/SANDBOX' : 'PRODUCTION');
  
  if (testMode) {
    log.info('In TEST MODE:');
    console.log('    • Uses test API keys (if different from production)');
    console.log('    • Networks checkout uses test payment methods');
    console.log('    • Test cards: 4200 0000 0000 0000 (success)');
    console.log('    • Webhooks still sent to SAME webhook URL');
    console.log('    • Transactions written to SAME database');
    console.log('    • checkout.test flag in request is set to true');
  } else {
    log.info('In PRODUCTION MODE:');
    console.log('    • Uses production API keys');
    console.log('    • Networks checkout uses real payment methods');
    console.log('    • Webhooks sent to production webhook URL');
    console.log('    • Transactions written to production database');
    console.log('    • checkout.test flag in request is set to false');
  }
  
  log.divider();
  log.warning('IMPORTANT: Test and Production use the SAME database!');
  log.info('Both test and production transactions should appear in:');
  log.data('Database', process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@') : 'Not configured');
  log.data('Console', 'https://console.neon.tech');
  
  // ============================================================================
  // STEP 5: Root Cause Analysis
  // ============================================================================
  log.section('5. Root Cause Analysis: Why Test Transactions Missing?');
  
  const possibleCauses = [
    {
      cause: 'Webhook not being delivered by Networks',
      check: 'Check Networks dashboard for webhook delivery logs',
      fix: 'Verify webhook URL in Networks dashboard matches: https://www.yum-mi.com/api/webhooks/networx',
    },
    {
      cause: 'Webhook URL is incorrect or inaccessible',
      check: 'Test webhook endpoint: curl https://www.yum-mi.com/api/webhooks/networx',
      fix: 'Should return: {"message":"Networx webhook endpoint is active","timestamp":"..."}',
    },
    {
      cause: 'Webhook received but user not found in database',
      check: 'Check Vercel logs for "❌ User not found" errors',
      fix: 'Ensure user exists before making payment (sign in first)',
    },
    {
      cause: 'Webhook received but description format wrong',
      check: 'Check Vercel logs for "❌ Cannot extract token count" errors',
      fix: 'Ensure description matches pattern: "... (100 Tokens)"',
    },
    {
      cause: 'Webhook received but status is not "completed" or "success"',
      check: 'Check Vercel logs for webhook body to see actual status',
      fix: 'Verify Networks sends status as "completed" or "success" (not "pending", "processing", etc.)',
    },
    {
      cause: 'Looking at wrong database in Neon Console',
      check: 'Verify DATABASE_URL matches the Neon project/branch you\'re viewing',
      fix: 'Get DATABASE_URL from Vercel env and find matching Neon project',
    },
    {
      cause: 'Using separate test database not visible in production console',
      check: 'Check if NETWORX_TEST_MODE uses different DATABASE_URL',
      fix: 'Code review shows SAME database for both modes - not the issue',
    },
    {
      cause: 'Webhook handler has errors and returns 500',
      check: 'Check Vercel logs: vercel logs --follow',
      fix: 'Fix any errors in webhook handler code',
    },
  ];
  
  possibleCauses.forEach((item, index) => {
    console.log(`\n  ${colors.yellow}${index + 1}. ${item.cause}${colors.reset}`);
    log.data('Check', item.check);
    log.data('Fix', item.fix);
  });
  
  // ============================================================================
  // STEP 6: Structured Logging Additions
  // ============================================================================
  log.section('6. Recommended Structured Logging');
  
  log.info('Add the following logs to app/api/webhooks/networx/route.ts:');
  
  console.log(`
${colors.cyan}At line 42 (after receiving webhook):${colors.reset}
console.log('🔍 [WEBHOOK-ENV]', {
  environment: process.env.NODE_ENV,
  testMode: process.env.NETWORX_TEST_MODE,
  databaseUrl: process.env.DATABASE_URL ? 'SET' : 'MISSING',
  timestamp: new Date().toISOString(),
});

${colors.cyan}At line 90 (before database operations):${colors.reset}
console.log('🔍 [WEBHOOK-DATA]', {
  tracking_id: tracking_id,
  amount: amount,
  currency: currency,
  status: status,
  description: order?.description,
  testFlag: checkout?.test, // If Networks includes test flag
});

${colors.cyan}At line 172 (after database write):${colors.reset}
console.log('🔍 [WEBHOOK-DB-WRITE]', {
  transactionId: savedTransaction.id,
  userId: userId,
  amount: amount,
  tokens: tokens,
  databaseUrl: process.env.DATABASE_URL?.includes('neon.tech') ? 'Neon Production' : 'Other',
  timestamp: new Date().toISOString(),
});
  `.trim());
  
  // ============================================================================
  // STEP 7: Reproduction Plan
  // ============================================================================
  log.section('7. Reproduction Plan');
  
  log.info('To reproduce and capture the issue:');
  console.log(`
  ${colors.yellow}Step 1: Enable detailed logging${colors.reset}
    • Add structured logging from Step 6 above
    • Deploy to Vercel: git push or vercel --prod
  
  ${colors.yellow}Step 2: Monitor logs in real-time${colors.reset}
    • Open terminal: vercel logs --follow
    • Filter for webhooks: vercel logs --follow | grep WEBHOOK
  
  ${colors.yellow}Step 3: Trigger test payment${colors.reset}
    • Visit: https://www.yum-mi.com/payment/test (or production)
    • Use test card: 4200 0000 0000 0000
    • Complete payment
  
  ${colors.yellow}Step 4: Verify webhook delivery${colors.reset}
    • Check Vercel logs for "📥 Networx HPP Webhook Received"
    • Check for [WEBHOOK-ENV] log with environment details
    • Check for [WEBHOOK-DATA] log with payment details
    • Check for [WEBHOOK-DB-WRITE] log confirming DB write
  
  ${colors.yellow}Step 5: Verify database record${colors.reset}
    • Query database:
      ${colors.dim}npx prisma studio${colors.reset}
    • Or SQL:
      ${colors.dim}SELECT * FROM "Transaction" ORDER BY "paid_at" DESC LIMIT 5;${colors.reset}
  
  ${colors.yellow}Step 6: Check Networks dashboard${colors.reset}
    • Login to Networks merchant dashboard
    • Navigate to Webhooks section
    • Verify webhook URL: https://www.yum-mi.com/api/webhooks/networx
    • Check webhook delivery logs
    • Look for failed deliveries or wrong URLs
  `.trim());
  
  // ============================================================================
  // STEP 8: Final Report
  // ============================================================================
  log.header();
  log.title('📊 DIAGNOSTIC REPORT SUMMARY');
  log.header();
  
  const getStatusSymbol = (status) => {
    switch (status) {
      case 'passed': return `${colors.green}✅ PASSED${colors.reset}`;
      case 'warning': return `${colors.yellow}⚠️  WARNING${colors.reset}`;
      case 'failed': return `${colors.red}❌ FAILED${colors.reset}`;
      default: return `${colors.dim}⏳ PENDING${colors.reset}`;
    }
  };
  
  console.log(`
  Environment Configuration:     ${getStatusSymbol(results.environment.status)}
  Database Connectivity:         ${getStatusSymbol(results.database.status)}
  Webhook Configuration:         ${getStatusSymbol(results.webhookConfig.status)}
  `.trim());
  
  if (results.environment.issues.length > 0) {
    log.section('Environment Issues:');
    results.environment.issues.forEach(issue => log.warning(issue));
  }
  
  if (results.database.issues.length > 0) {
    log.section('Database Issues:');
    results.database.issues.forEach(issue => log.warning(issue));
  }
  
  if (results.recommendations.length > 0) {
    log.section('Recommendations:');
    results.recommendations.forEach((rec, index) => {
      console.log(`  ${colors.cyan}${index + 1}.${colors.reset} ${rec}`);
    });
  }
  
  // ============================================================================
  // MOST LIKELY ROOT CAUSES
  // ============================================================================
  log.header();
  log.title('🎯 MOST LIKELY ROOT CAUSES (in order):');
  log.header();
  
  console.log(`
  ${colors.bright}${colors.red}1. Networks webhook not being delivered${colors.reset}
     ${colors.dim}• Check Networks dashboard for webhook delivery logs
     • Verify webhook URL matches: https://www.yum-mi.com/api/webhooks/networx
     • Test webhook endpoint accessibility
     ${colors.reset}
  
  ${colors.bright}${colors.yellow}2. User not found in database when webhook received${colors.reset}
     ${colors.dim}• Webhook handler returns 404 if user doesn't exist
     • Ensure user is signed in and exists in DB before payment
     • Check Vercel logs for "❌ User not found" errors
     ${colors.reset}
  
  ${colors.bright}${colors.yellow}3. Looking at wrong database/branch in Neon Console${colors.reset}
     ${colors.dim}• Verify DATABASE_URL from Vercel matches Neon project you're viewing
     • Neon has branches (main, dev, etc.) - ensure checking correct branch
     • Get DATABASE_URL: vercel env pull .env.local
     ${colors.reset}
  
  ${colors.bright}${colors.blue}4. Webhook received but returned before DB write${colors.reset}
     ${colors.dim}• Check for early returns in webhook handler (duplicate, validation errors)
     • Add logging to confirm DB write actually happens
     • Check for exceptions in DB write block
     ${colors.reset}
  `.trim());
  
  // ============================================================================
  // NEXT STEPS
  // ============================================================================
  log.header();
  log.title('🚀 NEXT STEPS');
  log.header();
  
  console.log(`
  ${colors.bright}Immediate Actions:${colors.reset}
  
  1️⃣  Add structured logging (see Step 6 above)
  2️⃣  Deploy logging changes: ${colors.cyan}git push${colors.reset} or ${colors.cyan}vercel --prod${colors.reset}
  3️⃣  Monitor logs: ${colors.cyan}vercel logs --follow${colors.reset}
  4️⃣  Trigger test payment and capture logs
  5️⃣  Check Networks dashboard webhook delivery logs
  6️⃣  Verify DATABASE_URL matches Neon Console view
  
  ${colors.bright}If issue persists:${colors.reset}
  
  • Share Vercel webhook logs (full webhook payload)
  • Share Networks webhook delivery logs
  • Confirm DATABASE_URL matches Neon project/branch
  • Run this script against production DB to verify connectivity
  `.trim());
  
  log.header();
  console.log('');
}

// Run diagnostics
if (require.main === module) {
  runDiagnostics()
    .then(() => {
      console.log(`${colors.green}✅ Diagnostic complete${colors.reset}\n`);
      process.exit(0);
    })
    .catch((error) => {
      console.error(`${colors.red}❌ Diagnostic failed: ${error.message}${colors.reset}`);
      console.error(error.stack);
      process.exit(1);
    });
}

module.exports = { runDiagnostics, createTestWebhookPayload };

