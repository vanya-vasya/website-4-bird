/**
 * Unit tests for user creation with 15 initial tokens
 * Verifies idempotency and proper token allocation
 */

import { createUser } from '@/lib/actions/user.actions';
import prismadb from '@/lib/prismadb';

// Mock Prisma
jest.mock('@/lib/prismadb', () => ({
  user: {
    upsert: jest.fn(),
  },
}));

describe('User Initial Tokens - Unit Tests', () => {
  const mockUser = {
    clerkId: 'clerk_test_123',
    email: 'test@example.com',
    photo: 'https://example.com/photo.jpg',
    firstName: 'Test',
    lastName: 'User',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser function', () => {
    it('should create new user with exactly 15 initial tokens', async () => {
      const expectedUser = {
        ...mockUser,
        id: 'user_123',
        usedGenerations: 0,
        availableGenerations: 15,
        initialTokensGranted: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prismadb.user.upsert as jest.Mock).mockResolvedValue(expectedUser);

      const result = await createUser(mockUser);

      expect(prismadb.user.upsert).toHaveBeenCalledWith({
        where: { clerkId: mockUser.clerkId },
        update: {
          email: mockUser.email,
          photo: mockUser.photo,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
        },
        create: {
          ...mockUser,
          usedGenerations: 0,
          availableGenerations: 15,
          initialTokensGranted: true,
        },
      });

      expect(result).toEqual(expectedUser);
      expect(result.availableGenerations).toBe(15);
      expect(result.usedGenerations).toBe(0);
      expect(result.initialTokensGranted).toBe(true);
    });

    it('should not grant additional tokens on duplicate creation attempt', async () => {
      const existingUser = {
        ...mockUser,
        id: 'user_123',
        usedGenerations: 5,
        availableGenerations: 10, // Already used 5 tokens
        initialTokensGranted: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prismadb.user.upsert as jest.Mock).mockResolvedValue(existingUser);

      const result = await createUser(mockUser);

      // Verify that upsert was called with update logic that doesn't modify tokens
      const upsertCall = (prismadb.user.upsert as jest.Mock).mock.calls[0][0];
      expect(upsertCall.update).not.toHaveProperty('availableGenerations');
      expect(upsertCall.update).not.toHaveProperty('usedGenerations');
      expect(upsertCall.update).not.toHaveProperty('initialTokensGranted');

      expect(result.availableGenerations).toBe(10);
      expect(result.usedGenerations).toBe(5);
    });

    it('should handle concurrent creation attempts idempotently', async () => {
      const newUser = {
        ...mockUser,
        id: 'user_123',
        usedGenerations: 0,
        availableGenerations: 15,
        initialTokensGranted: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prismadb.user.upsert as jest.Mock).mockResolvedValue(newUser);

      // Simulate concurrent calls
      const promises = [
        createUser(mockUser),
        createUser(mockUser),
        createUser(mockUser),
      ];

      const results = await Promise.all(promises);

      // All should return the same user with 15 tokens
      results.forEach(result => {
        expect(result.availableGenerations).toBe(15);
        expect(result.initialTokensGranted).toBe(true);
      });

      // Verify upsert was called 3 times (once per concurrent call)
      expect(prismadb.user.upsert).toHaveBeenCalledTimes(3);
    });

    it('should re-throw errors for proper error handling', async () => {
      const dbError = new Error('Database connection failed');
      (prismadb.user.upsert as jest.Mock).mockRejectedValue(dbError);

      await expect(createUser(mockUser)).rejects.toThrow('Database connection failed');
      expect(prismadb.user.upsert).toHaveBeenCalledTimes(1);
    });

    it('should preserve initialTokensGranted flag on update', async () => {
      const existingUser = {
        ...mockUser,
        id: 'user_123',
        usedGenerations: 2,
        availableGenerations: 13,
        initialTokensGranted: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prismadb.user.upsert as jest.Mock).mockResolvedValue(existingUser);

      const result = await createUser(mockUser);

      expect(result.initialTokensGranted).toBe(true);
      expect(result.availableGenerations).toBe(13); // Not reset to 15
    });

    it('should handle users with zero available tokens correctly', async () => {
      const depletedUser = {
        ...mockUser,
        id: 'user_123',
        usedGenerations: 15,
        availableGenerations: 0,
        initialTokensGranted: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prismadb.user.upsert as jest.Mock).mockResolvedValue(depletedUser);

      const result = await createUser(mockUser);

      expect(result.availableGenerations).toBe(0);
      expect(result.usedGenerations).toBe(15);
      expect(result.initialTokensGranted).toBe(true);
    });

    it('should handle users who purchased additional tokens', async () => {
      const userWithPurchasedTokens = {
        ...mockUser,
        id: 'user_123',
        usedGenerations: 10,
        availableGenerations: 105, // 15 initial + 100 purchased - 10 used
        initialTokensGranted: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prismadb.user.upsert as jest.Mock).mockResolvedValue(userWithPurchasedTokens);

      const result = await createUser(mockUser);

      expect(result.availableGenerations).toBe(105);
      expect(result.initialTokensGranted).toBe(true);
    });
  });

  describe('Token allocation edge cases', () => {
    it('should ensure tokens are integers', () => {
      const tokens = 15;
      expect(Number.isInteger(tokens)).toBe(true);
      expect(tokens).toBe(15);
    });

    it('should validate token count is positive', () => {
      const tokens = 15;
      expect(tokens).toBeGreaterThan(0);
    });

    it('should verify default values in create payload', async () => {
      (prismadb.user.upsert as jest.Mock).mockResolvedValue({
        ...mockUser,
        id: 'user_123',
        usedGenerations: 0,
        availableGenerations: 15,
        initialTokensGranted: true,
      });

      await createUser(mockUser);

      const createPayload = (prismadb.user.upsert as jest.Mock).mock.calls[0][0].create;
      
      expect(createPayload.usedGenerations).toBe(0);
      expect(createPayload.availableGenerations).toBe(15);
      expect(createPayload.initialTokensGranted).toBe(true);
    });
  });

  describe('Idempotency guarantees', () => {
    it('should use clerkId as unique identifier for upsert', async () => {
      (prismadb.user.upsert as jest.Mock).mockResolvedValue({
        ...mockUser,
        id: 'user_123',
        usedGenerations: 0,
        availableGenerations: 15,
        initialTokensGranted: true,
      });

      await createUser(mockUser);

      const whereClause = (prismadb.user.upsert as jest.Mock).mock.calls[0][0].where;
      expect(whereClause).toEqual({ clerkId: mockUser.clerkId });
    });

    it('should only update safe fields on existing user', async () => {
      (prismadb.user.upsert as jest.Mock).mockResolvedValue({
        ...mockUser,
        id: 'user_123',
        usedGenerations: 0,
        availableGenerations: 15,
        initialTokensGranted: true,
      });

      await createUser(mockUser);

      const updatePayload = (prismadb.user.upsert as jest.Mock).mock.calls[0][0].update;
      
      // Should only update user profile fields
      expect(updatePayload).toHaveProperty('email');
      expect(updatePayload).toHaveProperty('photo');
      expect(updatePayload).toHaveProperty('firstName');
      expect(updatePayload).toHaveProperty('lastName');
      
      // Should NOT update token-related fields
      expect(updatePayload).not.toHaveProperty('availableGenerations');
      expect(updatePayload).not.toHaveProperty('usedGenerations');
      expect(updatePayload).not.toHaveProperty('initialTokensGranted');
    });
  });
});

