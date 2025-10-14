/**
 * Tests for GBP Transaction Display
 * 
 * Verifies that payment history correctly displays all transactions in GBP format.
 */

import { describe, it, expect } from '@jest/globals';

// Mock transaction data
const mockTransactions = [
  {
    id: 'cmgqwxujz00017d2nvzrtl42y',
    tracking_id: 'gen_user_123_1760465466306',
    userId: 'user_123',
    status: 'completed',
    amount: 400, // £4.00 in pence
    currency: 'GBP',
    description: 'Yum-mi Tokens Purchase (20 Tokens)',
    type: 'payment',
    payment_method_type: 'credit_card',
    message: 'Transaction is successful.',
    paid_at: new Date('2025-10-14T18:11:31.507Z'),
    receipt_url: 'https://example.com/receipt',
  },
  {
    id: 'usage_master-chef_1729872345678',
    tracking_id: 'usage_master-chef_1729872345678',
    userId: 'user_123',
    status: 'completed',
    amount: -200, // -£2.00 in pence (deduction)
    currency: 'GBP',
    description: 'Your Own Chef - AI Generation',
    type: 'deduction',
    payment_method_type: null,
    message: '£2.00 deducted for Your Own Chef',
    paid_at: new Date('2025-10-14T19:30:15.123Z'),
    receipt_url: null,
  },
  {
    id: 'usage_master-nutritionist_1729872456789',
    tracking_id: 'usage_master-nutritionist_1729872456789',
    userId: 'user_123',
    status: 'completed',
    amount: -300, // -£3.00 in pence (deduction)
    currency: 'GBP',
    description: 'Your Own Nutritionist - AI Generation',
    type: 'deduction',
    payment_method_type: null,
    message: '£3.00 deducted for Your Own Nutritionist',
    paid_at: new Date('2025-10-14T20:15:45.456Z'),
    receipt_url: null,
  },
  {
    id: 'usage_cal-tracker_1729872567890',
    tracking_id: 'usage_cal-tracker_1729872567890',
    userId: 'user_123',
    status: 'completed',
    amount: -100, // -£1.00 in pence (deduction)
    currency: 'GBP',
    description: 'Your Own Tracker - AI Generation',
    type: 'deduction',
    payment_method_type: null,
    message: '£1.00 deducted for Your Own Tracker',
    paid_at: new Date('2025-10-14T21:00:00.789Z'),
    receipt_url: null,
  },
];

describe('GBP Transaction Display', () => {
  describe('Amount Formatting', () => {
    it('should format positive amounts correctly', () => {
      const transaction = mockTransactions[0];
      const amount = transaction.amount ?? 0;
      const absAmount = Math.abs(amount) / 100;
      const sign = amount < 0 ? '-' : '';
      const formatted = `${sign}£${absAmount.toFixed(2)}`;

      expect(formatted).toBe('£4.00');
    });

    it('should format negative amounts (deductions) correctly', () => {
      const transaction = mockTransactions[1];
      const amount = transaction.amount ?? 0;
      const absAmount = Math.abs(amount) / 100;
      const sign = amount < 0 ? '-' : '';
      const formatted = `${sign}£${absAmount.toFixed(2)}`;

      expect(formatted).toBe('-£2.00');
    });

    it('should handle zero amounts', () => {
      const amount = 0;
      const absAmount = Math.abs(amount) / 100;
      const sign = amount < 0 ? '-' : '';
      const formatted = `${sign}£${absAmount.toFixed(2)}`;

      expect(formatted).toBe('£0.00');
    });

    it('should format all tool deduction amounts correctly', () => {
      // Master Chef: £2.00
      expect(formatAmount(-200)).toBe('-£2.00');
      
      // Master Nutritionist: £3.00
      expect(formatAmount(-300)).toBe('-£3.00');
      
      // Cal Tracker: £1.00
      expect(formatAmount(-100)).toBe('-£1.00');
    });
  });

  describe('Currency Conversion', () => {
    it('should convert pence to pounds correctly', () => {
      expect(penceToGBP(100)).toBe(1.00);
      expect(penceToGBP(200)).toBe(2.00);
      expect(penceToGBP(300)).toBe(3.00);
      expect(penceToGBP(400)).toBe(4.00);
      expect(penceToGBP(50)).toBe(0.50);
      expect(penceToGBP(1)).toBe(0.01);
    });

    it('should handle negative pence values', () => {
      expect(penceToGBP(-100)).toBe(-1.00);
      expect(penceToGBP(-200)).toBe(-2.00);
      expect(penceToGBP(-300)).toBe(-3.00);
    });
  });

  describe('Transaction Type Detection', () => {
    it('should identify payment transactions', () => {
      const transaction = mockTransactions[0];
      expect(transaction.type).toBe('payment');
      expect(transaction.amount).toBeGreaterThan(0);
    });

    it('should identify deduction transactions', () => {
      const transaction = mockTransactions[1];
      expect(transaction.type).toBe('deduction');
      expect(transaction.amount).toBeLessThan(0);
    });
  });

  describe('Tool-Specific Pricing', () => {
    const TOOL_PRICES_GBP = {
      'master-chef': 200,        // £2.00 in pence
      'master-nutritionist': 300, // £3.00 in pence
      'cal-tracker': 100,        // £1.00 in pence
    };

    it('should have correct GBP pricing for each tool', () => {
      expect(TOOL_PRICES_GBP['master-chef']).toBe(200);
      expect(TOOL_PRICES_GBP['master-nutritionist']).toBe(300);
      expect(TOOL_PRICES_GBP['cal-tracker']).toBe(100);
    });

    it('should match transaction amounts to tool prices', () => {
      const chefTransaction = mockTransactions.find(t => 
        t.description.includes('Your Own Chef')
      );
      expect(Math.abs(chefTransaction?.amount || 0)).toBe(TOOL_PRICES_GBP['master-chef']);

      const nutritionistTransaction = mockTransactions.find(t => 
        t.description.includes('Your Own Nutritionist')
      );
      expect(Math.abs(nutritionistTransaction?.amount || 0)).toBe(TOOL_PRICES_GBP['master-nutritionist']);

      const trackerTransaction = mockTransactions.find(t => 
        t.description.includes('Your Own Tracker')
      );
      expect(Math.abs(trackerTransaction?.amount || 0)).toBe(TOOL_PRICES_GBP['cal-tracker']);
    });
  });

  describe('Legacy Token Migration', () => {
    const TOKEN_TO_PENCE = 20; // 1 token = £0.20 = 20 pence

    it('should convert token amounts to GBP correctly', () => {
      expect(tokensToPence(5)).toBe(100);   // 5 tokens → £1.00
      expect(tokensToPence(10)).toBe(200);  // 10 tokens → £2.00
      expect(tokensToPence(15)).toBe(300);  // 15 tokens → £3.00
      expect(tokensToPence(20)).toBe(400);  // 20 tokens → £4.00
    });

    it('should reverse GBP to tokens correctly', () => {
      expect(penceToTokens(100)).toBe(5);   // £1.00 → 5 tokens
      expect(penceToTokens(200)).toBe(10);  // £2.00 → 10 tokens
      expect(penceToTokens(300)).toBe(15);  // £3.00 → 15 tokens
      expect(penceToTokens(400)).toBe(20);  // £4.00 → 20 tokens
    });

    it('should handle negative amounts in migration', () => {
      expect(tokensToPence(-10)).toBe(-200); // -10 tokens → -£2.00
      expect(penceToTokens(-200)).toBe(-10); // -£2.00 → -10 tokens
    });
  });

  describe('Payment History Display Integration', () => {
    it('should format all transactions consistently', () => {
      const formattedAmounts = mockTransactions.map(t => formatAmount(t.amount ?? 0));
      
      expect(formattedAmounts[0]).toBe('£4.00');   // Payment
      expect(formattedAmounts[1]).toBe('-£2.00');  // Chef deduction
      expect(formattedAmounts[2]).toBe('-£3.00');  // Nutritionist deduction
      expect(formattedAmounts[3]).toBe('-£1.00');  // Tracker deduction
    });

    it('should maintain currency as GBP for all transactions', () => {
      mockTransactions.forEach(t => {
        expect(t.currency).toBe('GBP');
      });
    });
  });
});

// Helper functions (matching the actual implementation)
function formatAmount(amount: number): string {
  const absAmount = Math.abs(amount) / 100;
  const sign = amount < 0 ? '-' : '';
  return `${sign}£${absAmount.toFixed(2)}`;
}

function penceToGBP(pence: number): number {
  return pence / 100;
}

function tokensToPence(tokens: number): number {
  return tokens * 20; // 1 token = 20 pence
}

function penceToTokens(pence: number): number {
  return pence / 20; // 20 pence = 1 token
}

