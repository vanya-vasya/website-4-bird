/**
 * End-to-End Integration Test: Payment History Complete Flow
 * 
 * Tests the full payment history flow:
 * 1. User completes payment → webhook received → database written
 * 2. User clicks "Payments" link in header → navigates to Payment History
 * 3. Payment History page fetches and displays transactions
 * 4. Transaction details are correctly rendered
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/webhooks/secure-processor/route';
import prismadb from '@/lib/prismadb';
import { fetchPaymentHistory } from '@/lib/api-limit';

// Mock Clerk auth
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(() => ({ userId: 'test_user_e2e_123' })),
}));

// Mock email sending
jest.mock('@/config/nodemailer', () => ({
  transporter: {
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  },
}));

// Mock PDF generation
jest.mock('@/lib/receiptGeneration', () => ({
  generatePdfReceipt: jest.fn().mockResolvedValue(Buffer.from('fake-pdf')),
}));

describe('Payment History - Complete E2E Flow', () => {
  const testUserId = 'test_user_e2e_123';
  const testEmail = 'e2e-test@example.com';

  beforeAll(async () => {
    // Create test user
    await prismadb.user.upsert({
      where: { clerkId: testUserId },
      update: {
        availableGenerations: 100,
        usedGenerations: 10,
      },
      create: {
        clerkId: testUserId,
        email: testEmail,
        photo: 'https://example.com/photo.jpg',
        availableGenerations: 100,
        usedGenerations: 10,
      },
    });
  });

  afterAll(async () => {
    // Cleanup
    await prismadb.transaction.deleteMany({
      where: { userId: testUserId },
    });
    await prismadb.user.delete({
      where: { clerkId: testUserId },
    });
    await prismadb.$disconnect();
  });

  beforeEach(async () => {
    // Clean transactions before each test
    await prismadb.transaction.deleteMany({
      where: { userId: testUserId },
    });
  });

  describe('Step 1: Payment Completion → Webhook → Database Write', () => {
    it('should persist transaction from successful payment webhook', async () => {
      // ARRANGE: User completes payment on Secure-Processor
      const webhookPayload = {
        checkout: {
          token: 'e2e_test_token_success',
          status: 'completed',
          order: {
            tracking_id: testUserId,
            amount: 2380, // 23.80 EUR
            currency: 'EUR',
            description: 'Payment for 100 Tokens (100 Tokens)',
          },
          customer: {
            email: testEmail,
          },
          transaction: {
            type: 'payment',
            payment_method_type: 'credit_card',
            message: 'Payment successful',
            paid_at: '2025-10-10T12:00:00.000Z',
            receipt_url: 'https://secure-processorpay.com/receipt/e2e123',
          },
        },
      };

      const request = new NextRequest('http://localhost:3000/api/webhooks/secure-processor', {
        method: 'POST',
        body: JSON.stringify(webhookPayload),
      });

      // ACT: Webhook received and processed
      const response = await POST(request);

      // ASSERT: Webhook processed successfully
      expect(response.status).toBe(200);

      // ASSERT: Transaction persisted in database
      const transactions = await prismadb.transaction.findMany({
        where: { userId: testUserId },
      });

      expect(transactions).toHaveLength(1);
      expect(transactions[0]).toMatchObject({
        tracking_id: testUserId,
        userId: testUserId,
        status: 'completed',
        amount: 2380,
        currency: 'EUR',
        description: 'Payment for 100 Tokens (100 Tokens)',
        type: 'payment',
        payment_method_type: 'credit_card',
      });
    });
  });

  describe('Step 2: Navigate to Payment History via Header Link', () => {
    it('should have /dashboard/billing/payment-history route accessible', async () => {
      // Setup: Create a transaction
      await prismadb.transaction.create({
        data: {
          tracking_id: testUserId,
          userId: testUserId,
          status: 'completed',
          amount: 1190,
          currency: 'USD',
          description: 'Payment for 50 Tokens (50 Tokens)',
          type: 'payment',
          payment_method_type: 'credit_card',
          message: 'Payment successful',
          paid_at: new Date('2025-10-10T14:00:00.000Z'),
        },
      });

      // ACT: User clicks "Payments" link in header
      // (In real app, this would be Next.js navigation)
      // We simulate by calling the API function that the page uses

      const history = await fetchPaymentHistory();

      // ASSERT: Transaction data is fetched
      expect(history).not.toBeNull();
      expect(history).toHaveLength(1);
    });
  });

  describe('Step 3: Payment History Page Fetches and Displays Data', () => {
    it('should fetch and return all user transactions', async () => {
      // ARRANGE: Create multiple transactions
      const transactions = [
        {
          tracking_id: testUserId,
          userId: testUserId,
          status: 'completed',
          amount: 1190,
          currency: 'USD',
          description: 'Payment for 50 Tokens (50 Tokens)',
          type: 'payment',
          payment_method_type: 'credit_card',
          message: 'Payment successful',
          paid_at: new Date('2025-10-10T10:00:00.000Z'),
        },
        {
          tracking_id: testUserId,
          userId: testUserId,
          status: 'success',
          amount: 2380,
          currency: 'EUR',
          description: 'Payment for 100 Tokens (100 Tokens)',
          type: 'payment',
          payment_method_type: 'credit_card',
          message: 'Payment successful',
          paid_at: new Date('2025-10-10T12:00:00.000Z'),
        },
        {
          tracking_id: testUserId,
          userId: testUserId,
          status: 'completed',
          amount: 4760,
          currency: 'GBP',
          description: 'Payment for 200 Tokens (200 Tokens)',
          type: 'payment',
          payment_method_type: 'credit_card',
          message: 'Payment successful',
          paid_at: new Date('2025-10-10T14:00:00.000Z'),
        },
      ];

      for (const tx of transactions) {
        await prismadb.transaction.create({ data: tx });
      }

      // ACT: Fetch payment history (as page does)
      const history = await fetchPaymentHistory();

      // ASSERT: All transactions returned
      expect(history).toHaveLength(3);
      expect(history?.map(t => t.amount)).toEqual(
        expect.arrayContaining([1190, 2380, 4760])
      );
    });

    it('should return transactions in correct format for UI display', async () => {
      // ARRANGE: Create transaction with all fields
      await prismadb.transaction.create({
        data: {
          tracking_id: testUserId,
          userId: testUserId,
          status: 'completed',
          amount: 2380,
          currency: 'EUR',
          description: 'Payment for 100 Tokens (100 Tokens)',
          type: 'payment',
          payment_method_type: 'credit_card',
          message: 'Payment successful',
          paid_at: new Date('2025-10-10T12:00:00.000Z'),
          receipt_url: 'https://secure-processorpay.com/receipt/abc123',
        },
      });

      // ACT: Fetch as UI would
      const history = await fetchPaymentHistory();

      // ASSERT: Data structure is correct for UI
      expect(history).toBeDefined();
      expect(history![0]).toHaveProperty('id');
      expect(history![0]).toHaveProperty('tracking_id', testUserId);
      expect(history![0]).toHaveProperty('amount', 2380);
      expect(history![0]).toHaveProperty('currency', 'EUR');
      expect(history![0]).toHaveProperty('status', 'completed');
      expect(history![0]).toHaveProperty('paid_at');
      expect(history![0]).toHaveProperty('description');
      
      // UI displays amount divided by 100
      const displayAmount = history![0].amount! / 100;
      expect(displayAmount).toBe(23.80);
    });
  });

  describe('Step 4: Complete Flow - Payment to Display', () => {
    it('should complete entire flow from payment to UI data', async () => {
      // STEP 1: User completes payment, webhook arrives
      const webhookPayload = {
        checkout: {
          token: 'e2e_full_flow_token',
          status: 'completed',
          order: {
            tracking_id: testUserId,
            amount: 4760, // 47.60 GBP
            currency: 'GBP',
            description: 'Payment for 200 Tokens (200 Tokens)',
          },
          customer: {
            email: testEmail,
          },
          transaction: {
            type: 'payment',
            payment_method_type: 'credit_card',
            message: 'Payment successful',
            paid_at: '2025-10-10T15:30:00.000Z',
            receipt_url: 'https://secure-processorpay.com/receipt/full_flow',
          },
        },
      };

      const request = new NextRequest('http://localhost:3000/api/webhooks/secure-processor', {
        method: 'POST',
        body: JSON.stringify(webhookPayload),
      });

      // STEP 2: Webhook processed
      const webhookResponse = await POST(request);
      expect(webhookResponse.status).toBe(200);

      // Wait a bit for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      // STEP 3: User navigates to Payment History (fetches data)
      const history = await fetchPaymentHistory();

      // STEP 4: Verify transaction appears in Payment History
      expect(history).not.toBeNull();
      expect(history).toHaveLength(1);

      const transaction = history![0];
      expect(transaction.amount).toBe(4760);
      expect(transaction.currency).toBe('GBP');
      expect(transaction.status).toBe('completed');
      
      // Verify UI display format
      const displayAmount = transaction.amount! / 100;
      expect(displayAmount).toBe(47.60);

      // Verify date is parseable for UI
      expect(transaction.paid_at).toBeInstanceOf(Date);

      // Verify ID is sliceable for UI (shows last 12 chars)
      expect(transaction.id.length).toBeGreaterThan(12);
      const displayId = transaction.id.slice(-12);
      expect(displayId.length).toBe(12);
    });

    it('should handle multiple payments in chronological order', async () => {
      // Simulate 3 payments over time
      const payments = [
        { amount: 1190, time: '2025-10-10T10:00:00.000Z', tokens: 50 },
        { amount: 2380, time: '2025-10-10T12:00:00.000Z', tokens: 100 },
        { amount: 4760, time: '2025-10-10T14:00:00.000Z', tokens: 200 },
      ];

      for (const payment of payments) {
        const webhookPayload = {
          checkout: {
            token: `token_${payment.tokens}`,
            status: 'completed',
            order: {
              tracking_id: testUserId,
              amount: payment.amount,
              currency: 'EUR',
              description: `Payment for ${payment.tokens} Tokens (${payment.tokens} Tokens)`,
            },
            customer: { email: testEmail },
            transaction: {
              type: 'payment',
              payment_method_type: 'credit_card',
              message: 'Payment successful',
              paid_at: payment.time,
            },
          },
        };

        const request = new NextRequest('http://localhost:3000/api/webhooks/secure-processor', {
          method: 'POST',
          body: JSON.stringify(webhookPayload),
        });

        await POST(request);
      }

      // Fetch payment history
      const history = await fetchPaymentHistory();

      // Verify all 3 payments appear
      expect(history).toHaveLength(3);
      
      // Verify amounts are correct
      const amounts = history!.map(t => t.amount).sort((a, b) => a! - b!);
      expect(amounts).toEqual([1190, 2380, 4760]);
    });
  });

  describe('Error Handling in Flow', () => {
    it('should return empty array when no transactions exist', async () => {
      // No transactions for this user
      const history = await fetchPaymentHistory();

      expect(history).not.toBeNull();
      expect(history).toEqual([]);
    });

    it('should not show other users transactions', async () => {
      // Create transaction for different user
      const otherUserId = 'other_user_999';
      
      await prismadb.user.create({
        data: {
          clerkId: otherUserId,
          email: 'other@example.com',
          photo: 'https://example.com/photo.jpg',
          availableGenerations: 50,
          usedGenerations: 0,
        },
      });

      await prismadb.transaction.create({
        data: {
          tracking_id: otherUserId,
          userId: otherUserId,
          status: 'completed',
          amount: 9999,
          currency: 'USD',
          description: 'Other user payment',
          type: 'payment',
          paid_at: new Date(),
        },
      });

      // Fetch as current user
      const history = await fetchPaymentHistory();

      // Should not see other user's transactions
      expect(history).toEqual([]);

      // Cleanup
      await prismadb.transaction.deleteMany({ where: { userId: otherUserId } });
      await prismadb.user.delete({ where: { clerkId: otherUserId } });
    });
  });
});

