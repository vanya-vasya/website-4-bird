#!/usr/bin/env node
/**
 * Investigation Script: Find Missing User in Neon Database
 * 
 * This script investigates why user "vladimir.serushko.gmail.com" is missing
 * from the Neon production database.
 * 
 * Usage:
 *   1. Set PRODUCTION_DATABASE_URL in your environment
 *   2. Run: node scripts/investigate-neon-user.js
 * 
 * Or pass the database URL directly:
 *   DATABASE_URL="postgresql://..." node scripts/investigate-neon-user.js
 */

const { PrismaClient } = require('@prisma/client');

// ANSI color codes for better readability
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const log = {
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  data: (label, data) => console.log(`${colors.magenta}${label}:${colors.reset} ${data}`),
};

async function investigateUser() {
  // Check for production database URL
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    log.error('DATABASE_URL not set!');
    console.log('\n📋 To use this script, set the production DATABASE_URL:');
    console.log('   export DATABASE_URL="postgresql://...neon.tech/neondb?sslmode=require"');
    console.log('   node scripts/investigate-neon-user.js');
    console.log('\nOr pass it directly:');
    console.log('   DATABASE_URL="postgresql://..." node scripts/investigate-neon-user.js');
    process.exit(1);
  }

  // Mask the password in the URL for security
  const maskedUrl = databaseUrl.replace(/:[^:@]+@/, ':****@');
  
  log.header('🔍 NEON DATABASE USER INVESTIGATION');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  // Determine if this is Neon or local SQLite
  const isNeon = databaseUrl.includes('neon.tech');
  const isSQLite = databaseUrl.startsWith('file:');
  
  log.data('Database Type', isNeon ? 'Neon PostgreSQL (Production)' : isSQLite ? 'SQLite (Local)' : 'PostgreSQL');
  log.data('Connection String', maskedUrl);
  
  if (isSQLite) {
    log.warning('You are connecting to LOCAL SQLite database!');
    log.info('To investigate the production Neon database, use the production DATABASE_URL');
    console.log('   Get it from: https://console.neon.tech or Vercel dashboard\n');
  }
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });
  
  try {
    // Test connection
    log.header('📡 Testing Database Connection');
    await prisma.$queryRaw`SELECT 1`;
    log.success('Database connected successfully\n');
    
    // Extract database info for Neon
    if (isNeon) {
      const match = databaseUrl.match(/ep-([^.]+)/);
      const endpoint = match ? match[0] : 'unknown';
      log.data('Neon Endpoint', endpoint);
      log.data('Region', databaseUrl.includes('us-east') ? 'US East' : 'Other');
    }
    
    // Search for the target user
    log.header('🎯 Searching for Target User');
    console.log('Target email variants:');
    
    const searchVariants = [
      'vladimir.serushko.gmail.com',
      'vladimir.serushko@gmail.com',
      'vladimirserushko@gmail.com',
      'vladimir_serushko@gmail.com',
    ];
    
    searchVariants.forEach(v => console.log(`   • ${v}`));
    console.log('');
    
    let userFound = false;
    
    for (const email of searchVariants) {
      const user = await prisma.user.findFirst({
        where: {
          email: {
            equals: email,
            mode: 'insensitive',
          },
        },
        include: {
          transactions: {
            orderBy: {
              paid_at: 'desc',
            },
            take: 5,
          },
        },
      });
      
      if (user) {
        userFound = true;
        log.success(`USER FOUND with email: ${email}\n`);
        console.log('═══════════════════════════════════════════════════════════');
        console.log(JSON.stringify(user, null, 2));
        console.log('═══════════════════════════════════════════════════════════\n');
        break;
      }
    }
    
    if (!userFound) {
      log.error('User NOT found with any email variant\n');
    }
    
    // Database statistics
    log.header('📊 Database Statistics');
    const totalUsers = await prisma.user.count();
    const totalTransactions = await prisma.transaction.count();
    
    log.data('Total Users', totalUsers);
    log.data('Total Transactions', totalTransactions);
    console.log('');
    
    // Partial matches
    log.header('🔍 Searching for Partial Matches');
    const partialMatches = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: 'vladimir', mode: 'insensitive' } },
          { email: { contains: 'serushko', mode: 'insensitive' } },
          { firstName: { contains: 'vladimir', mode: 'insensitive' } },
          { lastName: { contains: 'serushko', mode: 'insensitive' } },
        ],
      },
      include: {
        transactions: {
          take: 3,
          orderBy: {
            paid_at: 'desc',
          },
        },
      },
    });
    
    if (partialMatches.length > 0) {
      log.success(`Found ${partialMatches.length} partial match(es):\n`);
      partialMatches.forEach((user, idx) => {
        console.log(`${idx + 1}. ${user.email} (${user.firstName} ${user.lastName})`);
        console.log(`   Clerk ID: ${user.clerkId}`);
        console.log(`   Generations: ${user.usedGenerations}/${user.availableGenerations}`);
        console.log(`   Transactions: ${user.transactions.length}`);
        console.log('');
      });
    } else {
      log.error('No partial matches found\n');
    }
    
    // List all users (limited to first 20)
    log.header('📋 All Users in Database (First 20)');
    const allUsers = await prisma.user.findMany({
      take: 20,
      orderBy: {
        id: 'desc',
      },
      select: {
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true,
        usedGenerations: true,
        availableGenerations: true,
      },
    });
    
    if (allUsers.length === 0) {
      log.warning('No users found in database!\n');
      log.info('This could indicate:');
      console.log('   1. Database is empty (no users have signed up)');
      console.log('   2. Clerk webhook is not configured correctly');
      console.log('   3. Connected to wrong database/branch\n');
    } else {
      console.log(`Showing ${allUsers.length} of ${totalUsers} total users:\n`);
      allUsers.forEach((user, idx) => {
        console.log(`${idx + 1}. ${user.email || 'No email'}`);
        console.log(`   Name: ${user.firstName || ''} ${user.lastName || ''}`);
        console.log(`   Clerk ID: ${user.clerkId.substring(0, 20)}...`);
        console.log(`   ID: ${user.id.substring(0, 20)}...`);
        console.log(`   Gens: ${user.usedGenerations}/${user.availableGenerations}`);
        console.log('');
      });
    }
    
    // Check for email pattern anomalies
    log.header('🔬 Email Pattern Analysis');
    const allEmails = await prisma.user.findMany({
      select: {
        email: true,
      },
    });
    
    const emailPatterns = {
      gmailWithDot: 0,
      gmailWithoutDot: 0,
      otherDomains: 0,
      malformed: 0,
    };
    
    allEmails.forEach(({ email }) => {
      if (!email || !email.includes('@')) {
        emailPatterns.malformed++;
      } else if (email.endsWith('@gmail.com')) {
        if (email.includes('.')) {
          emailPatterns.gmailWithDot++;
        } else {
          emailPatterns.gmailWithoutDot++;
        }
      } else {
        emailPatterns.otherDomains++;
      }
    });
    
    log.data('Gmail (with dots)', emailPatterns.gmailWithDot);
    log.data('Gmail (without dots)', emailPatterns.gmailWithoutDot);
    log.data('Other domains', emailPatterns.otherDomains);
    if (emailPatterns.malformed > 0) {
      log.warning(`Malformed emails: ${emailPatterns.malformed}`);
    }
    console.log('');
    
    // Check recent transactions
    log.header('💳 Recent Transactions (Last 10)');
    const recentTransactions = await prisma.transaction.findMany({
      take: 10,
      orderBy: {
        paid_at: 'desc',
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
    
    if (recentTransactions.length === 0) {
      log.warning('No transactions found\n');
    } else {
      recentTransactions.forEach((tx, idx) => {
        console.log(`${idx + 1}. ${tx.tracking_id}`);
        console.log(`   User: ${tx.user.email}`);
        console.log(`   Status: ${tx.status}`);
        console.log(`   Amount: ${tx.currency} ${tx.amount}`);
        console.log(`   Date: ${tx.paid_at ? tx.paid_at.toISOString() : 'N/A'}`);
        console.log('');
      });
    }
    
    // Recommendations
    log.header('🎯 Investigation Summary & Recommendations');
    
    if (userFound) {
      log.success('User account exists in the database');
    } else {
      log.error('User account NOT found in the database');
      console.log('\n📋 Possible reasons:');
      console.log('   1. User never completed signup in Clerk');
      console.log('   2. Clerk webhook failed during user creation');
      console.log('   3. User was deleted from the database');
      console.log('   4. Email normalization issue (e.g., dots in Gmail)');
      console.log('   5. Connected to wrong database branch/environment');
      
      console.log('\n🔧 Recommended actions:');
      console.log('   1. Check Clerk dashboard for this user account');
      console.log('   2. Verify Clerk webhook is properly configured:');
      console.log('      • Webhook URL: https://www.yum-mi.com/api/webhooks/clerk');
      console.log('      • Events: user.created, user.updated, user.deleted');
      console.log('      • WEBHOOK_SECRET is set in Vercel env vars');
      console.log('   3. Check Vercel logs for webhook errors');
      console.log('   4. If user exists in Clerk but not DB, manually trigger webhook');
      console.log('   5. Verify you\'re connected to production Neon database');
    }
    
    // Environment verification
    log.header('🌐 Environment Verification');
    log.data('Database Type', isNeon ? 'Neon (Production)' : isSQLite ? 'SQLite (Local)' : 'PostgreSQL');
    log.data('Total Users', totalUsers);
    log.data('Total Transactions', totalTransactions);
    
    if (isSQLite && totalUsers === 0) {
      log.warning('Local SQLite database is empty');
      log.info('This is normal for local development');
      log.info('To investigate production, use production DATABASE_URL from Vercel\n');
    }
    
  } catch (error) {
    log.header('❌ ERROR DURING INVESTIGATION');
    console.error(error);
    
    if (error.code === 'P1001') {
      log.error('Cannot reach database server');
      log.info('Check your DATABASE_URL and internet connection');
    } else if (error.code === 'P1017') {
      log.error('Database connection timeout');
      log.info('Neon database might be sleeping (free tier)');
      log.info('Try again in a few seconds');
    }
    
    console.log('\nError details:');
    console.log(`  Code: ${error.code || 'N/A'}`);
    console.log(`  Message: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

// Main execution
if (require.main === module) {
  investigateUser()
    .then(() => {
      console.log('\n✨ Investigation complete!\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Investigation failed:', error.message);
      process.exit(1);
    });
}

module.exports = { investigateUser };

