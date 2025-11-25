/**
 * Integration Test: Secure-Processor Webhook Database Write
 * 
 * Purpose: Verify that successful payment webhooks from Secure-Processor are properly
 * stored in the database and appear in Payment History.
 * 
 * Tests:
 * 1. Webhook receipt and parsing
 * 2. Database transaction creation
 * 3. User token balance update
 * 4. Payment History query returns new transaction
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/webhooks/secure-processor/route';
import prismadb from '@/lib/prismadb';
import { fetchPaymentHistory } from '@/lib/api-limit';

// Mock Clerk auth
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(() => ({ userId: 'test_user_123' })),
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

describe('Secure-Processor Webhook Database Write Integration Test', () => {
  const testUserId = 'test_user_123';
  
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
        email: 'test@example.com',
        photo: 'https://example.com/photo.jpg',
        availableGenerations: 100,
        usedGenerations: 10,
      },
    });
  });

  afterAll(async () => {
    // Cleanup: delete test transactions
    await prismadb.transaction.deleteMany({
      where: { userId: testUserId },
    });
    
    // Cleanup: delete test user
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

  it('should save successful payment webhook to database', async () => {
    // Arrange: Mock Secure-Processor HPP webhook payload (successful payment)
    const webhookPayload = {
      checkout: {
        token: 'test_token_abc123xyz',
        status: 'completed',
        order: {
          tracking_id: testUserId,
          amount: 2380, // 23.80 EUR in cents
          currency: 'EUR',
          description: 'Payment for 100 Tokens (100 Tokens)',
        },
        customer: {
          email: 'test@example.com',
        },
        transaction: {
          type: 'payment',
          payment_method_type: 'credit_card',
          message: 'Payment successful',
          paid_at: '2025-10-10T12:00:00.000Z',
          receipt_url: 'https://secure-processorpay.com/receipt/test123',
        },
      },
    };

    const request = new NextRequest('http://localhost:3000/api/webhooks/secure-processor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookPayload),
    });

    // Act: Send webhook
    const response = await POST(request);
    const responseData = await response.json();

    // Assert: Webhook processed successfully
    expect(response.status).toBe(200);
    expect(responseData.status).toBe('ok');

    // Assert: Transaction saved to database
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
      message: 'Payment successful',
      receipt_url: 'https://secure-processorpay.com/receipt/test123',
    });
    expect(transactions[0].paid_at).toBeInstanceOf(Date);

    // Assert: User token balance updated
    const updatedUser = await prismadb.user.findUnique({
      where: { clerkId: testUserId },
    });

    expect(updatedUser).not.toBeNull();
    expect(updatedUser!.availableGenerations).toBe(190); // 100 - 10 + 100 = 190
    expect(updatedUser!.usedGenerations).toBe(0);
  });

  it('should return transactions in Payment History after webhook', async () => {
    // Arrange: Create transaction via webhook
    const webhookPayload = {
      checkout: {
        token: 'test_token_history',
        status: 'success',
        order: {
          tracking_id: testUserId,
          amount: 1190, // 11.90 USD
          currency: 'USD',
          description: 'Payment for 50 Tokens (50 Tokens)',
        },
        customer: {
          email: 'test@example.com',
        },
        transaction: {
          type: 'payment',
          payment_method_type: 'credit_card',
          message: 'Approved',
          paid_at: '2025-10-10T14:30:00.000Z',
        },
      },
    };

    const request = new NextRequest('http://localhost:3000/api/webhooks/secure-processor', {
      method: 'POST',
      body: JSON.stringify(webhookPayload),
    });

    await POST(request);

    // Act: Fetch payment history (as user would see in UI)
    const history = await fetchPaymentHistory();

    // Assert: Transaction appears in history
    expect(history).not.toBeNull();
    expect(history).toHaveLength(1);
    expect(history![0]).toMatchObject({
      tracking_id: testUserId,
      userId: testUserId,
      status: 'success',
      amount: 1190,
      currency: 'USD',
    });
  });

  it('should handle webhook with missing user gracefully', async () => {
    // Arrange: Webhook for non-existent user
    const webhookPayload = {
      checkout: {
        token: 'test_token_nouser',
        status: 'completed',
        order: {
          tracking_id: 'nonexistent_user_999',
          amount: 1000,
          currency: 'EUR',
          description: 'Payment for 50 Tokens (50 Tokens)',
        },
        customer: {
          email: 'ghost@example.com',
        },
        transaction: {},
      },
    };

    const request = new NextRequest('http://localhost:3000/api/webhooks/secure-processor', {
      method: 'POST',
      body: JSON.stringify(webhookPayload),
    });

    // Act
    const response = await POST(request);
    const responseData = await response.json();

    // Assert: Should return 404
    expect(response.status).toBe(404);
    expect(responseData.error).toBe('User not found');
  });

  it('should handle webhook with invalid description format', async () => {
    // Arrange: Webhook with description missing token count
    const webhookPayload = {
      checkout: {
        token: 'test_token_invalid_desc',
        status: 'completed',
        order: {
          tracking_id: testUserId,
          amount: 1000,
          currency: 'EUR',
          description: 'Invalid payment description', // Missing "(X Tokens)" pattern
        },
        customer: {
          email: 'test@example.com',
        },
        transaction: {},
      },
    };

    const request = new NextRequest('http://localhost:3000/api/webhooks/secure-processor', {
      method: 'POST',
      body: JSON.stringify(webhookPayload),
    });

    // Act
    const response = await POST(request);
    const responseData = await response.json();

    // Assert: Should return 400
    expect(response.status).toBe(400);
    expect(responseData.error).toBe('Invalid description format');
  });

  it('should handle duplicate webhooks (idempotency)', async () => {
    // Arrange: Same webhook payload sent twice
    const webhookPayload = {
      checkout: {
        token: 'test_token_duplicate',
        status: 'completed',
        order: {
          tracking_id: testUserId,
          amount: 1190,
          currency: 'EUR',
          description: 'Payment for 50 Tokens (50 Tokens)',
        },
        customer: { email: 'test@example.com' },
        transaction: {
          paid_at: new Date().toISOString(),
        },
      },
    };

    const request1 = new NextRequest('http://localhost:3000/api/webhooks/secure-processor', {
      method: 'POST',
      body: JSON.stringify(webhookPayload),
    });

    const request2 = new NextRequest('http://localhost:3000/api/webhooks/secure-processor', {
      method: 'POST',
      body: JSON.stringify(webhookPayload),
    });

    // Act: Send same webhook twice (simulate retry)
    const response1 = await POST(request1);
    const response2 = await POST(request2);

    // Assert: Both return 200
    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);

    // Assert: Only ONE transaction created
    const transactions = await prismadb.transaction.findMany({
      where: { userId: testUserId },
    });

    expect(transactions).toHaveLength(1);
    expect(transactions[0].amount).toBe(1190);

    // Assert: User balance updated only once
    const user = await prismadb.user.findUnique({
      where: { clerkId: testUserId },
    });

    // Initial: 100 available, 10 used
    // After first webhook: (100 - 10) + 50 = 140
    // After duplicate webhook: still 140 (not 190)
    expect(user!.availableGenerations).toBe(140);
  });

  it('should handle multiple successful webhooks correctly', async () => {
    // Arrange: Send 3 successful webhooks
    const webhooks = [
      { amount: 1190, tokens: 50, description: 'Payment for 50 Tokens (50 Tokens)' },
      { amount: 2380, tokens: 100, description: 'Payment for 100 Tokens (100 Tokens)' },
      { amount: 4760, tokens: 200, description: 'Payment for 200 Tokens (200 Tokens)' },
    ];

    for (const webhook of webhooks) {
      const payload = {
        checkout: {
          token: `test_token_${webhook.tokens}`,
          status: 'completed',
          order: {
            tracking_id: testUserId,
            amount: webhook.amount,
            currency: 'EUR',
            description: webhook.description,
          },
          customer: { email: 'test@example.com' },
          transaction: {
            paid_at: new Date().toISOString(),
          },
        },
      };

      const request = new NextRequest('http://localhost:3000/api/webhooks/secure-processor', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      await POST(request);
    }

    // Act: Fetch all transactions
    const transactions = await prismadb.transaction.findMany({
      where: { userId: testUserId },
      orderBy: { paid_at: 'desc' },
    });

    // Assert: All 3 transactions saved
    expect(transactions).toHaveLength(3);
    expect(transactions.map(t => t.amount)).toEqual([4760, 2380, 1190]);

    // Assert: User balance updated correctly
    const user = await prismadb.user.findUnique({
      where: { clerkId: testUserId },
    });

    // Initial: 100 available, 10 used
    // After webhooks: (100 - 10) + 50 + 100 + 200 = 440
    expect(user!.availableGenerations).toBe(440);
    expect(user!.usedGenerations).toBe(0);
  });
});

