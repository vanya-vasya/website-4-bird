/**
 * Token Deduction Verification Script
 * 
 * Verifies that token deductions are working correctly after the fix.
 * 
 * Usage:
 *   node scripts/verify-token-deduction.js [userId]
 * 
 * Example:
 *   node scripts/verify-token-deduction.js user_344EICxxMgU6nNDHbBdUskRUPOG
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
};

async function verifyUser(userId) {
  log.section('═══════════════════════════════════════════════════════');
  log.section('  Token Deduction Verification - User Analysis');
  log.section('═══════════════════════════════════════════════════════');

  try {
    // 1. Fetch user data
    log.section('1. USER BALANCE');
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        clerkId: true,
        email: true,
        usedGenerations: true,
        availableGenerations: true,
      },
    });

    if (!user) {
      log.error(`User not found: ${userId}`);
      return;
    }

    const remainingCredits = user.availableGenerations - user.usedGenerations;

    console.log(`User: ${colors.bright}${user.email}${colors.reset}`);
    console.log(`Clerk ID: ${user.clerkId}`);
    console.log(`Used Generations: ${colors.yellow}${user.usedGenerations}${colors.reset} tokens`);
    console.log(`Available Generations: ${colors.cyan}${user.availableGenerations}${colors.reset} tokens`);
    console.log(`Remaining Credits: ${remainingCredits >= 10 ? colors.green : colors.red}${remainingCredits}${colors.reset} tokens`);

    // 2. Fetch transactions
    log.section('2. TRANSACTION HISTORY');

    const transactions = await prisma.transaction.findMany({
      where: { userId: userId },
      orderBy: { paid_at: 'desc' },
      take: 10,
    });

    if (transactions.length === 0) {
      log.warn('No transactions found for this user');
    } else {
      console.log(`Total Transactions: ${transactions.length}`);
      console.log('');

      // Group by type
      const purchases = transactions.filter(t => t.type === 'payment');
      const deductions = transactions.filter(t => t.type === 'deduction');

      console.log(`  Purchases: ${colors.green}${purchases.length}${colors.reset}`);
      console.log(`  Deductions: ${colors.yellow}${deductions.length}${colors.reset}`);
      console.log('');

      // Show recent transactions
      console.log('Recent Transactions:');
      console.log('─────────────────────────────────────────────────────────────────────');
      console.log('Type         | Amount | Description                    | Date');
      console.log('─────────────────────────────────────────────────────────────────────');

      transactions.slice(0, 5).forEach(t => {
        const typeColor = t.type === 'payment' ? colors.green : colors.yellow;
        const amountColor = (t.amount || 0) > 0 ? colors.green : colors.red;
        const type = (t.type || 'unknown').padEnd(12);
        const amount = `${amountColor}${(t.amount || 0).toString().padStart(6)}${colors.reset}`;
        const desc = (t.description || 'N/A').substring(0, 30).padEnd(30);
        const date = t.paid_at ? new Date(t.paid_at).toLocaleString() : 'N/A';
        console.log(`${typeColor}${type}${colors.reset} | ${amount} | ${desc} | ${date}`);
      });
      console.log('─────────────────────────────────────────────────────────────────────');
    }

    // 3. Verify balance integrity
    log.section('3. BALANCE INTEGRITY CHECK');

    const totalPurchased = transactions
      .filter(t => t.type === 'payment' && t.amount)
      .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);

    const totalDeducted = transactions
      .filter(t => t.type === 'deduction' && t.amount)
      .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);

    console.log(`Total Tokens Purchased: ${colors.green}${totalPurchased}${colors.reset}`);
    console.log(`Total Tokens Deducted: ${colors.yellow}${totalDeducted}${colors.reset}`);
    console.log(`Database usedGenerations: ${colors.yellow}${user.usedGenerations}${colors.reset}`);

    // Check if database usedGenerations matches transaction history
    const isBalanceCorrect = user.usedGenerations === totalDeducted;

    if (isBalanceCorrect) {
      log.success('Balance matches transaction history perfectly!');
    } else {
      log.error(`Balance mismatch! Database shows ${user.usedGenerations} but transactions total ${totalDeducted}`);
      const difference = user.usedGenerations - totalDeducted;
      log.warn(`Difference: ${difference} tokens`);
    }

    // 4. Check for recent deductions (fix verification)
    log.section('4. TOKEN DEDUCTION FIX VERIFICATION');

    const recentDeductions = deductions.filter(t => {
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return t.paid_at && new Date(t.paid_at) > dayAgo;
    });

    if (recentDeductions.length > 0) {
      log.success(`Found ${recentDeductions.length} token deduction(s) in the last 24 hours`);
      
      recentDeductions.forEach((t, i) => {
        console.log(`\n  Deduction ${i + 1}:`);
        console.log(`    Tracking ID: ${t.tracking_id}`);
        console.log(`    Amount: ${colors.red}${t.amount}${colors.reset} tokens`);
        console.log(`    Description: ${t.description}`);
        console.log(`    Timestamp: ${t.paid_at ? new Date(t.paid_at).toISOString() : 'N/A'}`);
      });

      log.success('✅ Token deduction system is WORKING!');
    } else {
      log.warn('No token deductions found in the last 24 hours');
      
      if (deductions.length > 0) {
        const lastDeduction = deductions[0];
        const lastDate = lastDeduction.paid_at ? new Date(lastDeduction.paid_at).toLocaleString() : 'Unknown';
        log.info(`Last deduction was on: ${lastDate}`);
      } else {
        log.info('User has never used any AI features (no deductions at all)');
      }
    }

    // 5. Breakdown by tool type
    log.section('5. AI TOOL USAGE BREAKDOWN');

    const toolUsage = {
      'master-chef': { count: 0, total: 0 },
      'master-nutritionist': { count: 0, total: 0 },
      'cal-tracker': { count: 0, total: 0 },
      'other': { count: 0, total: 0 },
    };

    deductions.forEach(t => {
      const toolId = t.tracking_id?.split('_')[1] || 'other';
      if (toolUsage[toolId]) {
        toolUsage[toolId].count++;
        toolUsage[toolId].total += Math.abs(t.amount || 0);
      } else {
        toolUsage.other.count++;
        toolUsage.other.total += Math.abs(t.amount || 0);
      }
    });

    console.log('Tool                      | Uses | Total Tokens');
    console.log('──────────────────────────|──────|─────────────');
    console.log(`Your Own Chef             | ${String(toolUsage['master-chef'].count).padStart(4)} | ${String(toolUsage['master-chef'].total).padStart(12)}`);
    console.log(`Your Own Nutritionist     | ${String(toolUsage['master-nutritionist'].count).padStart(4)} | ${String(toolUsage['master-nutritionist'].total).padStart(12)}`);
    console.log(`Your Own Tracker          | ${String(toolUsage['cal-tracker'].count).padStart(4)} | ${String(toolUsage['cal-tracker'].total).padStart(12)}`);
    console.log(`Other/Unknown             | ${String(toolUsage.other.count).padStart(4)} | ${String(toolUsage.other.total).padStart(12)}`);
    console.log('──────────────────────────|──────|─────────────');

    // 6. Final summary
    log.section('6. SUMMARY');

    const checks = [
      { name: 'User found in database', passed: !!user },
      { name: 'Has transaction history', passed: transactions.length > 0 },
      { name: 'Balance integrity correct', passed: isBalanceCorrect },
      { name: 'Recent deductions exist', passed: recentDeductions.length > 0 },
      { name: 'Has sufficient credits', passed: remainingCredits >= 10 },
    ];

    checks.forEach(check => {
      if (check.passed) {
        log.success(check.name);
      } else {
        log.error(check.name);
      }
    });

    const allPassed = checks.every(c => c.passed);

    console.log('');
    if (allPassed) {
      log.success('🎉 All checks passed! Token deduction system is working correctly.');
    } else {
      log.warn('⚠️  Some checks failed. Review the details above.');
    }

    log.section('═══════════════════════════════════════════════════════');

  } catch (error) {
    log.error('Error during verification:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

async function verifyAllUsers() {
  log.section('═══════════════════════════════════════════════════════');
  log.section('  Token Deduction Verification - All Users');
  log.section('═══════════════════════════════════════════════════════');

  try {
    const users = await prisma.user.findMany({
      select: {
        clerkId: true,
        email: true,
        usedGenerations: true,
        availableGenerations: true,
      },
    });

    log.info(`Total Users: ${users.length}`);
    console.log('');

    // Get transaction counts for each user
    const userStats = await Promise.all(
      users.map(async (user) => {
        const transactions = await prisma.transaction.findMany({
          where: { userId: user.clerkId },
        });

        const deductions = transactions.filter(t => t.type === 'deduction');
        const totalDeducted = deductions.reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);

        return {
          ...user,
          transactionCount: transactions.length,
          deductionCount: deductions.length,
          totalDeducted,
          balanceMatch: user.usedGenerations === totalDeducted,
          remainingCredits: user.availableGenerations - user.usedGenerations,
        };
      })
    );

    // Summary statistics
    log.section('STATISTICS');

    const totalDeductions = userStats.reduce((sum, u) => sum + u.deductionCount, 0);
    const usersWithMismatches = userStats.filter(u => !u.balanceMatch).length;
    const usersWithDeductions = userStats.filter(u => u.deductionCount > 0).length;

    console.log(`Total AI Generations: ${colors.yellow}${totalDeductions}${colors.reset}`);
    console.log(`Users with AI usage: ${colors.cyan}${usersWithDeductions}${colors.reset} / ${users.length}`);
    console.log(`Users with balance mismatches: ${usersWithMismatches > 0 ? colors.red : colors.green}${usersWithMismatches}${colors.reset}`);

    // Show users with mismatches
    if (usersWithMismatches > 0) {
      log.section('⚠️  USERS WITH BALANCE MISMATCHES');

      const mismatches = userStats.filter(u => !u.balanceMatch);

      console.log('Email                          | DB Used | Txn Total | Difference');
      console.log('───────────────────────────────|─────────|───────────|───────────');

      mismatches.forEach(u => {
        const diff = u.usedGenerations - u.totalDeducted;
        const diffColor = diff === 0 ? colors.green : colors.red;
        console.log(
          `${u.email.padEnd(30)} | ${String(u.usedGenerations).padStart(7)} | ${String(u.totalDeducted).padStart(9)} | ${diffColor}${String(diff).padStart(10)}${colors.reset}`
        );
      });
    }

    // Show most active users
    log.section('TOP 5 MOST ACTIVE USERS');

    const topUsers = [...userStats]
      .sort((a, b) => b.deductionCount - a.deductionCount)
      .slice(0, 5);

    console.log('Email                          | Generations | Tokens Used | Remaining');
    console.log('───────────────────────────────|─────────────|─────────────|──────────');

    topUsers.forEach(u => {
      const remaining = u.remainingCredits;
      const remainingColor = remaining > 10 ? colors.green : remaining > 0 ? colors.yellow : colors.red;
      console.log(
        `${u.email.padEnd(30)} | ${String(u.deductionCount).padStart(11)} | ${String(u.usedGenerations).padStart(11)} | ${remainingColor}${String(remaining).padStart(9)}${colors.reset}`
      );
    });

    // Final verdict
    log.section('VERIFICATION RESULT');

    if (usersWithMismatches === 0 && totalDeductions > 0) {
      log.success('✅ Token deduction system is working correctly for all users!');
    } else if (totalDeductions === 0) {
      log.warn('⚠️  No token deductions found. Either no users have used AI features, or the fix is not working.');
    } else {
      log.error('❌ Found balance mismatches. Manual reconciliation may be needed.');
    }

    log.section('═══════════════════════════════════════════════════════');

  } catch (error) {
    log.error('Error during verification:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Main execution
const userId = process.argv[2];

if (userId) {
  verifyUser(userId);
} else {
  verifyAllUsers();
}

