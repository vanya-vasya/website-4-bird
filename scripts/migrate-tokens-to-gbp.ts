/**
 * Migration Script: Convert Token-Based Transactions to GBP
 * 
 * This script migrates existing Transaction records from token-based to GBP-based amounts.
 * 
 * Conversion Rate: 1 token = £0.20 = 20 pence
 * - 5 tokens → £1.00 (100 pence)
 * - 10 tokens → £2.00 (200 pence)
 * - 15 tokens → £3.00 (300 pence)
 * 
 * Usage:
 *   npx ts-node scripts/migrate-tokens-to-gbp.ts [--dry-run] [--reverse]
 * 
 * Options:
 *   --dry-run  : Preview changes without modifying the database
 *   --reverse  : Reverse migration (GBP → tokens) for rollback
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Conversion rate: 1 token = £0.20 = 20 pence
const TOKEN_TO_PENCE = 20;

interface MigrationStats {
  totalProcessed: number;
  totalUpdated: number;
  totalSkipped: number;
  errors: Array<{ id: string; error: string }>;
}

async function migrateTokensToGBP(dryRun: boolean = false): Promise<MigrationStats> {
  const stats: MigrationStats = {
    totalProcessed: 0,
    totalUpdated: 0,
    totalSkipped: 0,
    errors: [],
  };

  console.log('\n🔄 Starting Token → GBP Migration');
  console.log(`Mode: ${dryRun ? '🔍 DRY RUN (Preview Only)' : '✏️  LIVE (Writing to DB)'}`);
  console.log('━'.repeat(80));

  try {
    // Find all transactions with currency="tokens"
    const tokenTransactions = await prisma.transaction.findMany({
      where: {
        currency: 'tokens',
      },
      orderBy: {
        paid_at: 'desc',
      },
    });

    console.log(`\n📊 Found ${tokenTransactions.length} token-based transactions\n`);

    if (tokenTransactions.length === 0) {
      console.log('✅ No token transactions found. Migration not needed.');
      return stats;
    }

    // Process each transaction
    for (const transaction of tokenTransactions) {
      stats.totalProcessed++;

      try {
        const tokenAmount = transaction.amount || 0;
        const gbpAmount = Math.abs(tokenAmount) * TOKEN_TO_PENCE;
        
        // Preserve the sign (negative for deductions, positive for credits)
        const signedGbpAmount = tokenAmount < 0 ? -gbpAmount : gbpAmount;

        // Generate new message
        const gbpFormatted = `£${(Math.abs(gbpAmount) / 100).toFixed(2)}`;
        const newMessage = transaction.message
          ?.replace(/(\d+)\s*tokens?/gi, `${gbpFormatted}`)
          || `${gbpFormatted} ${tokenAmount < 0 ? 'deducted' : 'added'}`;

        console.log(`\n${stats.totalProcessed}. Transaction ID: ${transaction.id.slice(-12)}`);
        console.log(`   Before: ${tokenAmount} tokens`);
        console.log(`   After:  ${signedGbpAmount} pence (${gbpFormatted})`);
        console.log(`   Type:   ${transaction.type}`);
        console.log(`   Description: ${transaction.description}`);
        console.log(`   Old Message: ${transaction.message}`);
        console.log(`   New Message: ${newMessage}`);

        if (!dryRun) {
          // Update the transaction
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              amount: signedGbpAmount,
              currency: 'GBP',
              message: newMessage,
            },
          });
          console.log(`   ✅ Updated successfully`);
          stats.totalUpdated++;
        } else {
          console.log(`   🔍 Would update (dry-run mode)`);
          stats.totalSkipped++;
        }
      } catch (error: any) {
        console.error(`   ❌ Error: ${error.message}`);
        stats.errors.push({
          id: transaction.id,
          error: error.message,
        });
      }
    }

    console.log('\n' + '━'.repeat(80));
    console.log('\n📈 Migration Summary:');
    console.log(`   Total Processed: ${stats.totalProcessed}`);
    console.log(`   Total Updated:   ${stats.totalUpdated}`);
    console.log(`   Total Skipped:   ${stats.totalSkipped}`);
    console.log(`   Errors:          ${stats.errors.length}`);

    if (stats.errors.length > 0) {
      console.log('\n❌ Errors:');
      stats.errors.forEach((err) => {
        console.log(`   - ${err.id}: ${err.error}`);
      });
    }

    if (dryRun) {
      console.log('\n⚠️  This was a DRY RUN. No changes were made to the database.');
      console.log('   Run without --dry-run to apply changes.');
    } else {
      console.log('\n✅ Migration completed successfully!');
    }

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }

  return stats;
}

async function reverseGBPToTokens(dryRun: boolean = false): Promise<MigrationStats> {
  const stats: MigrationStats = {
    totalProcessed: 0,
    totalUpdated: 0,
    totalSkipped: 0,
    errors: [],
  };

  console.log('\n🔄 Starting GBP → Token Reverse Migration');
  console.log(`Mode: ${dryRun ? '🔍 DRY RUN (Preview Only)' : '✏️  LIVE (Writing to DB)'}`);
  console.log('━'.repeat(80));

  try {
    // Find deduction transactions with currency="GBP" and type="deduction"
    // (We only reverse deductions, not payment deposits)
    const gbpTransactions = await prisma.transaction.findMany({
      where: {
        currency: 'GBP',
        type: 'deduction',
      },
      orderBy: {
        paid_at: 'desc',
      },
    });

    console.log(`\n📊 Found ${gbpTransactions.length} GBP deduction transactions\n`);

    if (gbpTransactions.length === 0) {
      console.log('✅ No GBP deductions found. Reverse migration not needed.');
      return stats;
    }

    // Process each transaction
    for (const transaction of gbpTransactions) {
      stats.totalProcessed++;

      try {
        const gbpAmount = transaction.amount || 0;
        const tokenAmount = Math.abs(gbpAmount) / TOKEN_TO_PENCE;
        
        // Preserve the sign (negative for deductions)
        const signedTokenAmount = gbpAmount < 0 ? -tokenAmount : tokenAmount;

        // Generate new message
        const newMessage = transaction.message
          ?.replace(/£[\d.]+/g, `${Math.abs(signedTokenAmount)} tokens`)
          || `${Math.abs(signedTokenAmount)} tokens deducted`;

        console.log(`\n${stats.totalProcessed}. Transaction ID: ${transaction.id.slice(-12)}`);
        console.log(`   Before: ${gbpAmount} pence (£${(Math.abs(gbpAmount) / 100).toFixed(2)})`);
        console.log(`   After:  ${signedTokenAmount} tokens`);
        console.log(`   Type:   ${transaction.type}`);
        console.log(`   Description: ${transaction.description}`);
        console.log(`   Old Message: ${transaction.message}`);
        console.log(`   New Message: ${newMessage}`);

        if (!dryRun) {
          // Update the transaction
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              amount: signedTokenAmount,
              currency: 'tokens',
              message: newMessage,
            },
          });
          console.log(`   ✅ Reversed successfully`);
          stats.totalUpdated++;
        } else {
          console.log(`   🔍 Would reverse (dry-run mode)`);
          stats.totalSkipped++;
        }
      } catch (error: any) {
        console.error(`   ❌ Error: ${error.message}`);
        stats.errors.push({
          id: transaction.id,
          error: error.message,
        });
      }
    }

    console.log('\n' + '━'.repeat(80));
    console.log('\n📈 Reverse Migration Summary:');
    console.log(`   Total Processed: ${stats.totalProcessed}`);
    console.log(`   Total Updated:   ${stats.totalUpdated}`);
    console.log(`   Total Skipped:   ${stats.totalSkipped}`);
    console.log(`   Errors:          ${stats.errors.length}`);

    if (stats.errors.length > 0) {
      console.log('\n❌ Errors:');
      stats.errors.forEach((err) => {
        console.log(`   - ${err.id}: ${err.error}`);
      });
    }

    if (dryRun) {
      console.log('\n⚠️  This was a DRY RUN. No changes were made to the database.');
      console.log('   Run without --dry-run to apply changes.');
    } else {
      console.log('\n✅ Reverse migration completed successfully!');
    }

  } catch (error: any) {
    console.error('\n❌ Reverse migration failed:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }

  return stats;
}

// Main execution
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const reverse = args.includes('--reverse');

if (reverse) {
  reverseGBPToTokens(dryRun).catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
} else {
  migrateTokensToGBP(dryRun).catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

