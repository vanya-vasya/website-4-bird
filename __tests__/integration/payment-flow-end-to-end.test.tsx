/**
 * Integration tests for payment flow end-to-end
 * Tests: payment success → transaction created → user balance updated → dashboard shows payment history
 */

import 'whatwg-fetch';
import { Request } from '@whatwg-node/fetch';
import { POST as NetworkxWebhookHandler, GET as NetworkxWebhookGet } from '@/app/api/webhooks/networx/route';
import prismadb from '@/lib/prismadb';
import { fetchPaymentHistory } from '@/lib/api-limit';

// Polyfill Request for Node environment
global.Request = Request as any;

// Mock Clerk auth
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(() => ({ userId: 'test_user_123' })),
}));

// Mock Resend (email service)
const mockResendSend = jest.fn().mockResolvedValue({ id: 'email_123' });
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: mockResendSend,
    },
  })),
}), { virtual: true });

// Mock prismadb
jest.mock('@/lib/prismadb', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}));

describe('Payment Flow End-to-End Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful Payment Flow', () => {
    it('should process payment webhook and create transaction record', async () => {
      // Setup: Mock user in database
      const mockUser = {
        id: 'user_internal_123',
        clerkId: 'test_user_123',
        email: 'test@example.com',
        usedGenerations: 5,
        availableGenerations: 20,
      };

      (prismadb.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismadb.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        availableGenerations: 30, // 20 - 5 + 15 = 30 (assuming 15 tokens purchased)
        usedGenerations: 0,
      });

      const mockTransaction = {
        id: 'txn_123456',
        tracking_id: 'gen_test_user_123_1234567890',
        userId: 'test_user_123',
        status: 'success',
        amount: 300, // £3.00 = 15 tokens at £0.20/token
        currency: 'GBP',
        description: 'Yum-mi Tokens Purchase (15 Tokens)',
        type: 'payment',
        payment_method_type: 'card',
        message: 'Payment completed successfully',
        paid_at: new Date('2025-10-09T12:00:00Z'),
        receipt_url: null,
      };

      (prismadb.transaction.create as jest.Mock).mockResolvedValue(mockTransaction);
      (prismadb.transaction.update as jest.Mock).mockResolvedValue({
        ...mockTransaction,
        receipt_url: 'data:application/pdf;base64,...',
      });

      // Create webhook request
      const webhookPayload = {
        checkout: {
          token: 'token_123',
          status: 'success',
          order: {
            tracking_id: 'gen_test_user_123_1234567890',
            amount: 300,
            currency: 'GBP',
            description: 'Yum-mi Tokens Purchase (15 Tokens)',
          },
          customer: {
            email: 'test@example.com',
          },
          transaction: {
            payment_method_type: 'card',
            message: 'Payment completed successfully',
            paid_at: '2025-10-09T12:00:00Z',
          },
        },
      };

      const request = new Request('http://localhost:3000/api/webhooks/networx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload),
      });

      // Execute webhook handler
      const response = await NetworkxWebhookHandler(request as any);
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(responseData).toEqual({ status: 'ok' });

      // Verify user lookup was called
      expect(prismadb.user.findUnique).toHaveBeenCalledWith({
        where: { clerkId: 'test_user_123' },
        select: {
          id: true,
          clerkId: true,
          email: true,
          usedGenerations: true,
          availableGenerations: true,
        },
      });

      // Verify user balance was updated
      expect(prismadb.user.update).toHaveBeenCalledWith({
        where: { clerkId: 'test_user_123' },
        data: {
          availableGenerations: 30, // 20 - 5 + 15
          usedGenerations: 0,
        },
      });

      // Verify transaction was created
      expect(prismadb.transaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tracking_id: 'gen_test_user_123_1234567890',
          userId: 'test_user_123',
          status: 'success',
          amount: 300,
          currency: 'GBP',
          type: 'payment',
        }),
      });

      // Verify receipt was updated
      expect(prismadb.transaction.update).toHaveBeenCalledWith({
        where: { id: 'txn_123456' },
        data: expect.objectContaining({
          receipt_url: expect.stringContaining('data:application/pdf;base64'),
        }),
      });
    });

    it('should calculate correct token amount from payment', async () => {
      const mockUser = {
        id: 'user_123',
        clerkId: 'test_user_123',
        email: 'test@example.com',
        usedGenerations: 0,
        availableGenerations: 10,
      };

      (prismadb.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismadb.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        availableGenerations: 60, // 10 + 50 tokens
      });

      (prismadb.transaction.create as jest.Mock).mockResolvedValue({
        id: 'txn_123',
        tracking_id: 'gen_test_user_123_1234567890',
        userId: 'test_user_123',
        status: 'success',
        amount: 1000, // £10.00 = 50 tokens
        currency: 'GBP',
      });

      (prismadb.transaction.update as jest.Mock).mockResolvedValue({});

      const webhookPayload = {
        checkout: {
          token: 'token_123',
          status: 'success',
          order: {
            tracking_id: 'gen_test_user_123_1234567890',
            amount: 1000, // £10.00
            currency: 'GBP',
          },
          customer: { email: 'test@example.com' },
          transaction: {},
        },
      };

      const request = new Request('http://localhost:3000/api/webhooks/networx', {
        method: 'POST',
        body: JSON.stringify(webhookPayload),
      });

      await NetworkxWebhookHandler(request as any);

      // Should add 50 tokens (1000 pence / 20 pence per token)
      expect(prismadb.user.update).toHaveBeenCalledWith({
        where: { clerkId: 'test_user_123' },
        data: {
          availableGenerations: 60,
          usedGenerations: 0,
        },
      });
    });
  });

  describe('Failed Payment Handling', () => {
    it('should log failed payment without updating user balance', async () => {
      (prismadb.transaction.create as jest.Mock).mockResolvedValue({
        id: 'txn_failed_123',
        status: 'failed',
      });

      const webhookPayload = {
        checkout: {
          token: 'token_123',
          status: 'failed',
          order: {
            tracking_id: 'gen_test_user_123_1234567890',
            amount: 500,
            currency: 'GBP',
            description: 'Payment failed',
          },
          customer: { email: 'test@example.com' },
          transaction: {
            error_message: 'Card declined',
          },
        },
      };

      const request = new Request('http://localhost:3000/api/webhooks/networx', {
        method: 'POST',
        body: JSON.stringify(webhookPayload),
      });

      const response = await NetworkxWebhookHandler(request as any);

      expect(response.status).toBe(200);

      // Should NOT update user balance
      expect(prismadb.user.update).not.toHaveBeenCalled();

      // Should log failed transaction
      expect(prismadb.transaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: 'failed',
          message: 'Card declined',
        }),
      });
    });
  });

  describe('Payment History Display', () => {
    it('should fetch and display payment history for authenticated user', async () => {
      const mockTransactions = [
        {
          id: 'txn_1',
          tracking_id: 'gen_test_user_123_111',
          userId: 'test_user_123',
          status: 'success',
          amount: 500,
          currency: 'GBP',
          description: 'Yum-mi Tokens (25 Tokens)',
          paid_at: new Date('2025-10-09T10:00:00Z'),
          receipt_url: 'data:application/pdf;base64,abc123',
        },
        {
          id: 'txn_2',
          tracking_id: 'gen_test_user_123_222',
          userId: 'test_user_123',
          status: 'success',
          amount: 200,
          currency: 'GBP',
          description: 'Yum-mi Tokens (10 Tokens)',
          paid_at: new Date('2025-10-08T15:30:00Z'),
          receipt_url: 'data:application/pdf;base64,def456',
        },
      ];

      (prismadb.transaction.findMany as jest.Mock).mockResolvedValue(mockTransactions);

      const transactions = await fetchPaymentHistory();

      expect(transactions).toHaveLength(2);
      expect(transactions).toEqual(mockTransactions);
      expect(prismadb.transaction.findMany).toHaveBeenCalledWith({
        where: { userId: 'test_user_123' },
      });
    });

    it('should return empty array when no transactions exist', async () => {
      (prismadb.transaction.findMany as jest.Mock).mockResolvedValue([]);

      const transactions = await fetchPaymentHistory();

      expect(transactions).toEqual([]);
    });

    it('should handle database errors gracefully', async () => {
      (prismadb.transaction.findMany as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      const transactions = await fetchPaymentHistory();

      expect(transactions).toBeNull();
    });
  });

  describe('Refund Handling', () => {
    it('should process refund and deduct tokens from user balance', async () => {
      const mockOriginalTransaction = {
        id: 'txn_original',
        tracking_id: 'gen_test_user_123_1234567890',
        userId: 'test_user_123',
        status: 'success',
        amount: 400, // 20 tokens
        currency: 'GBP',
      };

      const mockUser = {
        id: 'user_123',
        clerkId: 'test_user_123',
        availableGenerations: 50,
      };

      (prismadb.transaction.findFirst as jest.Mock).mockResolvedValue(mockOriginalTransaction);
      (prismadb.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismadb.user.update as jest.Mock).mockResolvedValue({});
      (prismadb.transaction.update as jest.Mock).mockResolvedValue({});

      const webhookPayload = {
        checkout: {
          token: 'token_123',
          status: 'refunded',
          order: {
            tracking_id: 'gen_test_user_123_1234567890',
            amount: 400,
            currency: 'GBP',
          },
          customer: { email: 'test@example.com' },
          transaction: {},
        },
      };

      const request = new Request('http://localhost:3000/api/webhooks/networx', {
        method: 'POST',
        body: JSON.stringify(webhookPayload),
      });

      await NetworkxWebhookHandler(request as any);

      // Should deduct 20 tokens (400 pence / 20 pence per token)
      expect(prismadb.user.update).toHaveBeenCalledWith({
        where: { clerkId: 'test_user_123' },
        data: {
          availableGenerations: 30, // 50 - 20
        },
      });

      // Should mark transaction as refunded
      expect(prismadb.transaction.update).toHaveBeenCalledWith({
        where: { id: 'txn_original' },
        data: { status: 'refunded' },
      });
    });
  });

  describe('Webhook Endpoint Health Check', () => {
    it('should respond to GET request with health status', async () => {
      const response = await NetworkxWebhookGet();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('message');
      expect(data.message).toBe('Networx webhook endpoint is active');
      expect(data).toHaveProperty('timestamp');
    });
  });

  describe('Invalid Tracking ID Handling', () => {
    it('should handle invalid tracking_id format gracefully', async () => {
      const webhookPayload = {
        checkout: {
          token: 'token_123',
          status: 'success',
          order: {
            tracking_id: 'invalid_format', // Wrong format
            amount: 500,
            currency: 'GBP',
          },
          customer: { email: 'test@example.com' },
          transaction: {},
        },
      };

      const request = new Request('http://localhost:3000/api/webhooks/networx', {
        method: 'POST',
        body: JSON.stringify(webhookPayload),
      });

      const response = await NetworkxWebhookHandler(request as any);

      expect(response.status).toBe(200);

      // Should NOT update user or create transaction
      expect(prismadb.user.update).not.toHaveBeenCalled();
      expect(prismadb.transaction.create).not.toHaveBeenCalled();
    });
  });

  describe('User Not Found Handling', () => {
    it('should handle non-existent user gracefully', async () => {
      (prismadb.user.findUnique as jest.Mock).mockResolvedValue(null);

      const webhookPayload = {
        checkout: {
          token: 'token_123',
          status: 'success',
          order: {
            tracking_id: 'gen_nonexistent_user_1234567890',
            amount: 500,
            currency: 'GBP',
          },
          customer: { email: 'test@example.com' },
          transaction: {},
        },
      };

      const request = new Request('http://localhost:3000/api/webhooks/networx', {
        method: 'POST',
        body: JSON.stringify(webhookPayload),
      });

      const response = await NetworkxWebhookHandler(request as any);

      expect(response.status).toBe(200);

      // Should NOT update user or create transaction
      expect(prismadb.user.update).not.toHaveBeenCalled();
      expect(prismadb.transaction.create).not.toHaveBeenCalled();
    });
  });
});

