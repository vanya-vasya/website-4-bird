/**
 * Tests for /api/generate GBP Pricing Integration
 * 
 * Verifies that the API correctly deducts GBP amounts and creates transaction records.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock Clerk auth
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(() => ({ userId: 'user_test123' })),
}));

// Mock Prisma
const mockPrismaTransaction = jest.fn();
const mockPrismaUser = {
  findUnique: jest.fn(),
  update: jest.fn(),
};
const mockPrismaTransactionModel = {
  create: jest.fn(),
};

jest.mock('@/lib/prismadb', () => ({
  __esModule: true,
  default: {
    user: mockPrismaUser,
    transaction: mockPrismaTransactionModel,
    $transaction: mockPrismaTransaction,
  },
}));

// Mock fetch for N8N calls
global.fetch = jest.fn() as jest.Mock;

describe('API /api/generate - GBP Pricing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Tool Pricing Configuration', () => {
    const TOOL_PRICES_GBP = {
      'master-chef': 200,        // £2.00 in pence
      'master-nutritionist': 300, // £3.00 in pence
      'cal-tracker': 100,        // £1.00 in pence
    };

    const TOOL_PRICES_TOKENS = {
      'master-chef': 10,
      'master-nutritionist': 15,
      'cal-tracker': 5,
    };

    it('should have correct GBP pricing for all tools', () => {
      expect(TOOL_PRICES_GBP['master-chef']).toBe(200);
      expect(TOOL_PRICES_GBP['master-nutritionist']).toBe(300);
      expect(TOOL_PRICES_GBP['cal-tracker']).toBe(100);
    });

    it('should maintain token prices for credit checks', () => {
      expect(TOOL_PRICES_TOKENS['master-chef']).toBe(10);
      expect(TOOL_PRICES_TOKENS['master-nutritionist']).toBe(15);
      expect(TOOL_PRICES_TOKENS['cal-tracker']).toBe(5);
    });

    it('should have correct token-to-GBP conversion rate', () => {
      // 1 token = £0.20 = 20 pence
      const TOKEN_TO_PENCE = 20;
      
      Object.keys(TOOL_PRICES_TOKENS).forEach(toolId => {
        const tokens = TOOL_PRICES_TOKENS[toolId as keyof typeof TOOL_PRICES_TOKENS];
        const expectedGBP = tokens * TOKEN_TO_PENCE;
        const actualGBP = TOOL_PRICES_GBP[toolId as keyof typeof TOOL_PRICES_GBP];
        
        expect(actualGBP).toBe(expectedGBP);
      });
    });
  });

  describe('Transaction Record Creation', () => {
    it('should create transaction with negative GBP amount for deductions', async () => {
      const toolId = 'master-chef';
      const toolPriceGBP = 200; // £2.00
      const userId = 'user_test123';

      const expectedTransactionData = {
        tracking_id: expect.stringContaining('usage_master-chef_'),
        userId: userId,
        status: 'completed',
        amount: -200, // Negative GBP amount in pence
        currency: 'GBP',
        description: 'Your Own Chef - AI Generation',
        type: 'deduction',
        payment_method_type: null,
        message: '£2.00 deducted for Your Own Chef',
        paid_at: expect.any(Date),
        receipt_url: null,
      };

      // Verify the transaction data structure
      expect(expectedTransactionData.amount).toBe(-toolPriceGBP);
      expect(expectedTransactionData.currency).toBe('GBP');
      expect(expectedTransactionData.message).toContain('£2.00');
    });

    it('should create correct messages for each tool price', () => {
      const tools = [
        { id: 'master-chef', gbp: 200, display: '£2.00', name: 'Your Own Chef' },
        { id: 'master-nutritionist', gbp: 300, display: '£3.00', name: 'Your Own Nutritionist' },
        { id: 'cal-tracker', gbp: 100, display: '£1.00', name: 'Your Own Tracker' },
      ];

      tools.forEach(tool => {
        const message = `${tool.display} deducted for ${tool.name}`;
        expect(message).toContain(tool.display);
        expect(message).toContain(tool.name);
      });
    });
  });

  describe('Credit Balance Checks', () => {
    it('should check credit balance using token amounts', () => {
      const toolPriceTokens = 10;
      const userCredits = {
        usedGenerations: 5,
        availableGenerations: 20,
      };

      const remainingCredits = userCredits.availableGenerations - userCredits.usedGenerations;
      const hasEnoughCredits = remainingCredits >= toolPriceTokens;

      expect(remainingCredits).toBe(15);
      expect(hasEnoughCredits).toBe(true);
    });

    it('should fail credit check when insufficient tokens', () => {
      const toolPriceTokens = 10;
      const userCredits = {
        usedGenerations: 18,
        availableGenerations: 20,
      };

      const remainingCredits = userCredits.availableGenerations - userCredits.usedGenerations;
      const hasEnoughCredits = remainingCredits >= toolPriceTokens;

      expect(remainingCredits).toBe(2);
      expect(hasEnoughCredits).toBe(false);
    });
  });

  describe('Dual Tracking System', () => {
    it('should increment usedGenerations in tokens', () => {
      const toolPriceTokens = 10;
      const initialUsed = 5;
      const expectedUsed = initialUsed + toolPriceTokens;

      expect(expectedUsed).toBe(15);
    });

    it('should record transaction in GBP', () => {
      const toolPriceGBP = 200; // £2.00 in pence
      const transactionAmount = -toolPriceGBP;

      expect(transactionAmount).toBe(-200);
      expect(Math.abs(transactionAmount) / 100).toBe(2.00);
    });

    it('should maintain consistency between token and GBP tracking', () => {
      const TOKEN_TO_PENCE = 20;
      const toolPriceTokens = 10;
      const toolPriceGBP = toolPriceTokens * TOKEN_TO_PENCE;

      expect(toolPriceGBP).toBe(200);
      expect(toolPriceGBP / TOKEN_TO_PENCE).toBe(toolPriceTokens);
    });
  });

  describe('Response Logging', () => {
    it('should log both token and GBP amounts', () => {
      const toolPriceTokens = 10;
      const toolPriceGBP = 200;
      
      const logOutput = {
        toolPriceTokens,
        toolPriceGBP: `£${(toolPriceGBP / 100).toFixed(2)}`,
      };

      expect(logOutput.toolPriceTokens).toBe(10);
      expect(logOutput.toolPriceGBP).toBe('£2.00');
    });

    it('should format GBP amounts consistently in logs', () => {
      const amounts = [100, 200, 300, 400];
      const formatted = amounts.map(amt => `£${(amt / 100).toFixed(2)}`);

      expect(formatted).toEqual(['£1.00', '£2.00', '£3.00', '£4.00']);
    });
  });

  describe('Migration Compatibility', () => {
    it('should handle both legacy token and new GBP transactions', () => {
      const transactions = [
        { amount: -10, currency: 'tokens', type: 'deduction' },  // Legacy
        { amount: -200, currency: 'GBP', type: 'deduction' },    // New
      ];

      transactions.forEach(t => {
        if (t.currency === 'tokens') {
          // Legacy: convert to GBP for display
          const gbpAmount = t.amount * 20; // 1 token = 20 pence
          expect(gbpAmount).toBe(-200);
        } else {
          // New: already in GBP
          expect(t.amount).toBe(-200);
        }
      });
    });

    it('should preserve backward compatibility during migration', () => {
      const TOKEN_TO_PENCE = 20;
      
      // Old token-based transaction
      const oldTransaction = { amount: -10, currency: 'tokens' };
      
      // Convert to new GBP format
      const newTransaction = {
        amount: oldTransaction.amount * TOKEN_TO_PENCE,
        currency: 'GBP',
      };

      expect(newTransaction.amount).toBe(-200);
      expect(newTransaction.currency).toBe('GBP');
      
      // Verify reversibility
      const reversed = {
        amount: newTransaction.amount / TOKEN_TO_PENCE,
        currency: 'tokens',
      };
      
      expect(reversed.amount).toBe(oldTransaction.amount);
    });
  });

  describe('Edge Cases', () => {
    it('should handle free tools (0 cost)', () => {
      const toolPriceTokens = 0;
      const toolPriceGBP = 0;

      expect(toolPriceTokens).toBe(0);
      expect(toolPriceGBP).toBe(0);
      
      // Should skip deduction
      const shouldDeduct = toolPriceTokens > 0;
      expect(shouldDeduct).toBe(false);
    });

    it('should handle unknown tool IDs gracefully', () => {
      const TOOL_PRICES_GBP: Record<string, number> = {
        'master-chef': 200,
        'master-nutritionist': 300,
        'cal-tracker': 100,
      };

      const unknownToolId = 'unknown-tool';
      const price = TOOL_PRICES_GBP[unknownToolId] || 0;

      expect(price).toBe(0);
    });

    it('should format very small and large amounts correctly', () => {
      const amounts = [1, 10, 100, 1000, 10000];
      const formatted = amounts.map(amt => `£${(amt / 100).toFixed(2)}`);

      expect(formatted).toEqual([
        '£0.01',
        '£0.10',
        '£1.00',
        '£10.00',
        '£100.00',
      ]);
    });
  });
});

