/**
 * Test Suite: Token Deduction in /api/generate
 * 
 * Verifies that tokens are properly decremented when AI features are used
 * 
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import prismadb from '@/lib/prismadb';
import { auth } from '@clerk/nextjs/server';

// Mock dependencies BEFORE importing the route
jest.mock('@clerk/nextjs/server');
jest.mock('@/lib/prismadb', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

// Mock fetch for N8N webhook
global.fetch = jest.fn();

// Import the route AFTER mocking
import { POST } from '@/app/api/generate/route';

describe('/api/generate - Token Deduction', () => {
  const mockUserId = 'user_test123';
  const mockN8nUrl = 'https://test.n8n.cloud/webhook/test';

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.N8N_WEBHOOK_URL = mockN8nUrl;
    (auth as jest.Mock).mockReturnValue({ userId: mockUserId });
  });

  afterEach(() => {
    delete process.env.N8N_WEBHOOK_URL;
  });

  describe('Authentication', () => {
    it('should reject unauthenticated requests', async () => {
      (auth as jest.Mock).mockReturnValue({ userId: null });

      const req = new NextRequest('http://localhost:3000/api/generate', {
        method: 'POST',
        body: JSON.stringify({ tool: { id: 'master-chef' } }),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('Credit Balance Check', () => {
    it('should check credit balance before processing', async () => {
      const mockUser = {
        usedGenerations: 5,
        availableGenerations: 20,
      };

      (prismadb.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const req = new NextRequest('http://localhost:3000/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          tool: { id: 'master-chef' },
          message: { content: 'Test' },
        }),
      });

      await POST(req);

      expect(prismadb.user.findUnique).toHaveBeenCalledWith({
        where: { clerkId: mockUserId },
        select: {
          usedGenerations: true,
          availableGenerations: true,
        },
      });
    });

    it('should reject requests with insufficient credits', async () => {
      const mockUser = {
        usedGenerations: 18,
        availableGenerations: 20, // Only 2 credits remaining
      };

      (prismadb.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const req = new NextRequest('http://localhost:3000/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          tool: { id: 'master-chef' }, // Requires 10 credits
          message: { content: 'Test' },
        }),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Insufficient credits');
      expect(data.required).toBe(10);
      expect(data.available).toBe(2);
    });

    it('should allow requests with sufficient credits', async () => {
      const mockUser = {
        usedGenerations: 5,
        availableGenerations: 20, // 15 credits remaining
      };

      (prismadb.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ response: 'AI response' }),
        headers: new Map([['content-type', 'application/json']]),
      });

      (prismadb.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback({
          user: {
            update: jest.fn().mockResolvedValue({
              usedGenerations: 15,
              availableGenerations: 20,
            }),
          },
          transaction: {
            create: jest.fn().mockResolvedValue({}),
          },
        });
      });

      const req = new NextRequest('http://localhost:3000/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          tool: { id: 'master-chef' }, // Requires 10 credits
          message: { content: 'Test' },
        }),
      });

      const response = await POST(req);

      expect(response.status).toBe(200);
    });
  });

  describe('Token Deduction', () => {
    it('should deduct tokens after successful AI generation', async () => {
      const mockUser = {
        usedGenerations: 10,
        availableGenerations: 30,
      };

      (prismadb.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ response: 'AI response' }),
        headers: new Map([['content-type', 'application/json']]),
      });

      const mockTransactionCallback = jest.fn();
      (prismadb.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          user: {
            update: jest.fn().mockResolvedValue({
              usedGenerations: 20, // 10 + 10 (master-chef price)
              availableGenerations: 30,
            }),
          },
          transaction: {
            create: mockTransactionCallback,
          },
        };
        return callback(tx);
      });

      const req = new NextRequest('http://localhost:3000/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          tool: { id: 'master-chef' },
          message: { content: 'Test request' },
        }),
      });

      await POST(req);

      // Verify transaction was used
      expect(prismadb.$transaction).toHaveBeenCalled();

      // Verify transaction record was created
      expect(mockTransactionCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: mockUserId,
            status: 'completed',
            amount: -10, // Negative for deduction
            currency: 'tokens',
            type: 'deduction',
            description: 'Your Own Chef - AI Generation',
            message: '10 tokens deducted for Your Own Chef',
          }),
        })
      );
    });

    it('should NOT deduct tokens if AI generation fails', async () => {
      const mockUser = {
        usedGenerations: 10,
        availableGenerations: 30,
      };

      (prismadb.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
        headers: new Map([['content-type', 'text/plain']]),
      });

      const req = new NextRequest('http://localhost:3000/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          tool: { id: 'master-chef' },
          message: { content: 'Test request' },
        }),
      });

      await POST(req);

      // Verify NO transaction was created
      expect(prismadb.$transaction).not.toHaveBeenCalled();
    });

    it('should handle different tool prices correctly', async () => {
      const tools = [
        { id: 'master-chef', price: 10, name: 'Your Own Chef' },
        { id: 'master-nutritionist', price: 15, name: 'Your Own Nutritionist' },
        { id: 'cal-tracker', price: 5, name: 'Your Own Tracker' },
      ];

      for (const tool of tools) {
        jest.clearAllMocks();

        const mockUser = {
          usedGenerations: 0,
          availableGenerations: 50,
        };

        (prismadb.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ response: 'AI response' }),
          headers: new Map([['content-type', 'application/json']]),
        });

        const mockTransactionCallback = jest.fn();
        (prismadb.$transaction as jest.Mock).mockImplementation(async (callback) => {
          const tx = {
            user: {
              update: jest.fn().mockResolvedValue({
                usedGenerations: tool.price,
                availableGenerations: 50,
              }),
            },
            transaction: {
              create: mockTransactionCallback,
            },
          };
          return callback(tx);
        });

        const req = new NextRequest('http://localhost:3000/api/generate', {
          method: 'POST',
          body: JSON.stringify({
            tool: { id: tool.id },
            message: { content: 'Test request' },
          }),
        });

        await POST(req);

        expect(mockTransactionCallback).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              amount: -tool.price,
              description: `${tool.name} - AI Generation`,
              message: `${tool.price} tokens deducted for ${tool.name}`,
            }),
          })
        );
      }
    });
  });

  describe('Transaction Record Creation', () => {
    it('should create transaction record with correct schema', async () => {
      const mockUser = {
        usedGenerations: 5,
        availableGenerations: 20,
      };

      (prismadb.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ response: 'AI response' }),
        headers: new Map([['content-type', 'application/json']]),
      });

      const mockTransactionCallback = jest.fn();
      (prismadb.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          user: {
            update: jest.fn().mockResolvedValue({
              usedGenerations: 20,
              availableGenerations: 20,
            }),
          },
          transaction: {
            create: mockTransactionCallback,
          },
        };
        return callback(tx);
      });

      const req = new NextRequest('http://localhost:3000/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          tool: { id: 'master-nutritionist' }, // 15 tokens
          message: { content: 'Test request' },
        }),
      });

      await POST(req);

      expect(mockTransactionCallback).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tracking_id: expect.stringMatching(/^usage_master-nutritionist_\d+$/),
          userId: mockUserId,
          status: 'completed',
          amount: -15,
          currency: 'tokens',
          description: 'Your Own Nutritionist - AI Generation',
          type: 'deduction',
          payment_method_type: null,
          message: '15 tokens deducted for Your Own Nutritionist',
          paid_at: expect.any(Date),
          receipt_url: null,
        }),
      });
    });
  });

  describe('Atomic Operations', () => {
    it('should use database transaction for atomic operations', async () => {
      const mockUser = {
        usedGenerations: 10,
        availableGenerations: 30,
      };

      (prismadb.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ response: 'AI response' }),
        headers: new Map([['content-type', 'application/json']]),
      });

      (prismadb.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          user: {
            update: jest.fn().mockResolvedValue({
              usedGenerations: 20,
              availableGenerations: 30,
            }),
          },
          transaction: {
            create: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(tx);
      });

      const req = new NextRequest('http://localhost:3000/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          tool: { id: 'master-chef' },
          message: { content: 'Test request' },
        }),
      });

      await POST(req);

      // Verify that $transaction was called
      expect(prismadb.$transaction).toHaveBeenCalledTimes(1);
      expect(prismadb.$transaction).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const mockUser = {
        usedGenerations: 10,
        availableGenerations: 30,
      };

      (prismadb.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ response: 'AI response' }),
        headers: new Map([['content-type', 'application/json']]),
      });

      (prismadb.$transaction as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      const req = new NextRequest('http://localhost:3000/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          tool: { id: 'master-chef' },
          message: { content: 'Test request' },
        }),
      });

      // Should still return AI response even if DB write fails
      const response = await POST(req);
      expect(response.status).toBe(200);
    });

    it('should return 404 if user not found in database', async () => {
      (prismadb.user.findUnique as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          tool: { id: 'master-chef' },
          message: { content: 'Test request' },
        }),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('User not found');
    });
  });

  describe('Free Tools', () => {
    it('should skip credit checks for free tools (toolPrice = 0)', async () => {
      // Mock unknown tool (defaults to 0 price)
      const req = new NextRequest('http://localhost:3000/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          tool: { id: 'unknown-free-tool' },
          message: { content: 'Test request' },
        }),
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ response: 'AI response' }),
        headers: new Map([['content-type', 'application/json']]),
      });

      await POST(req);

      // Should NOT check credits for free tools
      expect(prismadb.user.findUnique).not.toHaveBeenCalled();
      // Should NOT deduct tokens
      expect(prismadb.$transaction).not.toHaveBeenCalled();
    });
  });
});

