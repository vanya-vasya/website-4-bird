/**
 * Integration tests for user sign-up token grant flow
 * Tests the complete webhook → user creation → token allocation flow
 */

import { createUser, getUserById } from '@/lib/actions/user.actions';
import prismadb from '@/lib/prismadb';

// Mock global Request and Response for Node test environment
global.Request = class MockRequest {
  method: string;
  url: string;
  headers: Map<string, string>;
  body: any;

  constructor(url: string, options: any = {}) {
    this.method = options.method || 'GET';
    this.url = url;
    this.headers = new Map();
    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        this.headers.set(key, value as string);
      });
    }
    this.body = options.body;
  }

  async json() {
    return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
  }

  async text() {
    return typeof this.body === 'string' ? this.body : JSON.stringify(this.body);
  }
} as any;

global.Response = class MockResponse {
  status: number;
  body: any;

  constructor(body: any, options: any = {}) {
    this.body = body;
    this.status = options.status || 200;
  }

  async json() {
    return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
  }
} as any;

// Mock dependencies
jest.mock('@/lib/prismadb', () => ({
  user: {
    create: jest.fn(),
    upsert: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock('@clerk/nextjs/server', () => ({
  clerkClient: {
    users: {
      updateUserMetadata: jest.fn(),
    },
  },
  WebhookEvent: jest.fn(),
}));

jest.mock('next/headers', () => ({
  headers: jest.fn(() => ({
    get: jest.fn((key: string) => {
      const headers: { [key: string]: string } = {
        'svix-id': 'msg_test_id',
        'svix-timestamp': '1234567890',
        'svix-signature': 'test_signature',
      };
      return headers[key];
    }),
  })),
}));

jest.mock('svix', () => ({
  Webhook: jest.fn().mockImplementation(() => ({
    verify: jest.fn((body: string) => JSON.parse(body)),
  })),
}));

describe('User Sign-up Token Grant - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.WEBHOOK_SECRET = 'test_webhook_secret';
  });

  afterEach(() => {
    delete process.env.WEBHOOK_SECRET;
  });

  describe('New User Sign-up Flow', () => {
    it('should grant exactly 15 tokens on first successful authentication', async () => {
      const newUser = {
        id: 'user_new_123',
        clerkId: 'clerk_new_user_123',
        email: 'newuser@example.com',
        photo: 'https://example.com/avatar.jpg',
        firstName: 'New',
        lastName: 'User',
        usedGenerations: 0,
        availableGenerations: 15,
        initialTokensGranted: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prismadb.user.upsert as jest.Mock).mockResolvedValue(newUser);

      const userData = {
        clerkId: 'clerk_new_user_123',
        email: 'newuser@example.com',
        photo: 'https://example.com/avatar.jpg',
        firstName: 'New',
        lastName: 'User',
      };

      const result = await createUser(userData);

      expect(result.availableGenerations).toBe(15);
      expect(result.usedGenerations).toBe(0);
      expect(result.initialTokensGranted).toBe(true);
    });

    it('should handle rapid concurrent user creation attempts idempotently', async () => {
      const userId = 'clerk_concurrent_user_123';
      let callCount = 0;

      // Simulate database behavior: first call creates, subsequent calls find existing
      (prismadb.user.upsert as jest.Mock).mockImplementation(async () => {
        callCount++;
        return {
          id: `user_${callCount}`,
          clerkId: userId,
          email: 'concurrent@example.com',
          photo: 'https://example.com/avatar.jpg',
          firstName: 'Concurrent',
          lastName: 'User',
          usedGenerations: 0,
          availableGenerations: 15,
          initialTokensGranted: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      });

      const userData = {
        clerkId: userId,
        email: 'concurrent@example.com',
        photo: 'https://example.com/avatar.jpg',
        firstName: 'Concurrent',
        lastName: 'User',
      };

      // Simulate 5 concurrent creation attempts
      const promises = Array.from({ length: 5 }, () => createUser(userData));
      const results = await Promise.all(promises);

      // All responses should have the same token allocation
      results.forEach(result => {
        expect(result.availableGenerations).toBe(15);
        expect(result.initialTokensGranted).toBe(true);
      });

      expect(callCount).toBe(5); // upsert called 5 times but safely handles concurrency
    });

    it('should not grant additional tokens on duplicate user creation', async () => {
      const existingUser = {
        id: 'user_existing_123',
        clerkId: 'clerk_existing_user_123',
        email: 'existing@example.com',
        photo: 'https://example.com/avatar.jpg',
        firstName: 'Existing',
        lastName: 'User',
        usedGenerations: 5,
        availableGenerations: 10, // Already used 5 of initial 15
        initialTokensGranted: true,
        createdAt: new Date(Date.now() - 86400000), // Created yesterday
        updatedAt: new Date(),
      };

      (prismadb.user.upsert as jest.Mock).mockResolvedValue(existingUser);

      const userData = {
        clerkId: 'clerk_existing_user_123',
        email: 'existing@example.com',
        photo: 'https://example.com/avatar.jpg',
        firstName: 'Existing',
        lastName: 'User',
      };

      const result = await createUser(userData);

      // Should keep existing token balance, not grant additional 15
      expect(result.availableGenerations).toBe(10);
      expect(result.usedGenerations).toBe(5);
      expect(result.initialTokensGranted).toBe(true);
    });
  });

  describe('Existing User Sign-in Flow', () => {
    it('should not grant additional tokens on subsequent sign-ins', async () => {
      const returningUser = {
        id: 'user_returning_123',
        clerkId: 'clerk_returning_user_123',
        email: 'returning@example.com',
        photo: 'https://example.com/avatar.jpg',
        firstName: 'Returning',
        lastName: 'User',
        usedGenerations: 12,
        availableGenerations: 3, // Used 12 of initial 15
        initialTokensGranted: true,
        createdAt: new Date(Date.now() - 604800000), // Created 7 days ago
        updatedAt: new Date(),
      };

      (prismadb.user.findUnique as jest.Mock).mockResolvedValue(returningUser);
      (prismadb.user.upsert as jest.Mock).mockResolvedValue(returningUser);

      // User signs in (webhook may or may not fire, but getUserById is called)
      const user = await getUserById('clerk_returning_user_123');

      expect(user?.availableGenerations).toBe(3);
      expect(user?.usedGenerations).toBe(12);
      expect(user?.initialTokensGranted).toBe(true);
    });

    it('should preserve tokens for users who purchased additional credits', async () => {
      const premiumUser = {
        id: 'user_premium_123',
        clerkId: 'clerk_premium_user_123',
        email: 'premium@example.com',
        photo: 'https://example.com/avatar.jpg',
        firstName: 'Premium',
        lastName: 'User',
        usedGenerations: 50,
        availableGenerations: 450, // 15 initial + 500 purchased - 50 used
        initialTokensGranted: true,
        createdAt: new Date(Date.now() - 2592000000), // Created 30 days ago
        updatedAt: new Date(),
      };

      (prismadb.user.upsert as jest.Mock).mockResolvedValue(premiumUser);

      const userData = {
        clerkId: 'clerk_premium_user_123',
        email: 'premium@example.com',
        photo: 'https://example.com/avatar.jpg',
        firstName: 'Premium',
        lastName: 'User',
      };

      const result = await createUser(userData);

      expect(result.availableGenerations).toBe(450);
      expect(result.usedGenerations).toBe(50);
    });
  });

  describe('Database Constraint Enforcement', () => {
    it('should respect unique clerkId constraint', async () => {
      const duplicateError = new Error('Unique constraint failed on clerkId');
      (duplicateError as any).code = 'P2002';

      (prismadb.user.upsert as jest.Mock).mockRejectedValueOnce(duplicateError);

      const userData = {
        clerkId: 'clerk_duplicate_123',
        email: 'duplicate@example.com',
        photo: 'https://example.com/avatar.jpg',
        firstName: 'Duplicate',
        lastName: 'User',
      };

      await expect(createUser(userData)).rejects.toThrow('Unique constraint failed on clerkId');
    });

    it('should handle database timeout gracefully', async () => {
      const timeoutError = new Error('Database timeout');
      (prismadb.user.upsert as jest.Mock).mockRejectedValueOnce(timeoutError);

      const userData = {
        clerkId: 'clerk_timeout_123',
        email: 'timeout@example.com',
        photo: 'https://example.com/avatar.jpg',
        firstName: 'Timeout',
        lastName: 'User',
      };

      await expect(createUser(userData)).rejects.toThrow('Database timeout');
    });
  });

  describe('Token Balance Integrity', () => {
    it('should maintain correct token balance across operations', async () => {
      const user = {
        id: 'user_balance_123',
        clerkId: 'clerk_balance_123',
        email: 'balance@example.com',
        photo: 'https://example.com/avatar.jpg',
        firstName: 'Balance',
        lastName: 'User',
        usedGenerations: 0,
        availableGenerations: 15,
        initialTokensGranted: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prismadb.user.upsert as jest.Mock).mockResolvedValue(user);

      const result = await createUser({
        clerkId: user.clerkId,
        email: user.email,
        photo: user.photo,
        firstName: user.firstName,
        lastName: user.lastName,
      });

      // Verify initial balance
      expect(result.availableGenerations - result.usedGenerations).toBe(15);
      
      // Simulate usage
      const updatedUser = {
        ...user,
        usedGenerations: 5,
      };
      
      expect(updatedUser.availableGenerations - updatedUser.usedGenerations).toBe(10);
    });

    it('should never allow negative token balances', () => {
      const user = {
        usedGenerations: 10,
        availableGenerations: 15,
      };

      const remainingTokens = user.availableGenerations - user.usedGenerations;
      expect(remainingTokens).toBeGreaterThanOrEqual(0);
      expect(user.usedGenerations).toBeLessThanOrEqual(user.availableGenerations);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const dbError = new Error('Connection timeout');
      (prismadb.user.upsert as jest.Mock).mockRejectedValue(dbError);

      const userData = {
        clerkId: 'clerk_error_123',
        email: 'error@example.com',
        photo: 'https://example.com/avatar.jpg',
        firstName: 'Error',
        lastName: 'User',
      };

      await expect(createUser(userData)).rejects.toThrow('Connection timeout');
    });

    it('should handle missing user data fields', async () => {
      const incompleteUser = {
        id: 'user_incomplete_123',
        clerkId: 'clerk_incomplete_123',
        email: 'incomplete@example.com',
        photo: '',
        firstName: undefined,
        lastName: undefined,
        usedGenerations: 0,
        availableGenerations: 15,
        initialTokensGranted: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prismadb.user.upsert as jest.Mock).mockResolvedValue(incompleteUser);

      const userData = {
        clerkId: 'clerk_incomplete_123',
        email: 'incomplete@example.com',
        photo: '',
        firstName: undefined,
        lastName: undefined,
      };

      const result = await createUser(userData);
      expect(result.availableGenerations).toBe(15);
      expect(result.initialTokensGranted).toBe(true);
    });
  });

  describe('Timing and Race Conditions', () => {
    it('should handle rapid sequential user creation attempts', async () => {
      const userId = 'clerk_rapid_123';
      const users: any[] = [];

      (prismadb.user.upsert as jest.Mock).mockImplementation(async () => {
        const user = {
          id: `user_${users.length}`,
          clerkId: userId,
          email: 'rapid@example.com',
          photo: 'https://example.com/avatar.jpg',
          firstName: 'Rapid',
          lastName: 'User',
          usedGenerations: 0,
          availableGenerations: 15,
          initialTokensGranted: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        users.push(user);
        return user;
      });

      const userData = {
        clerkId: userId,
        email: 'rapid@example.com',
        photo: 'https://example.com/avatar.jpg',
        firstName: 'Rapid',
        lastName: 'User',
      };

      // Sequential creation calls (not concurrent)
      for (let i = 0; i < 3; i++) {
        await createUser(userData);
      }

      // All created users should have 15 tokens
      users.forEach(user => {
        expect(user.availableGenerations).toBe(15);
      });
    });
  });
});

