"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface CreditContextType {
  usedGenerations: number;
  availableGenerations: number;
  remainingCredits: number;
  isLoading: boolean;
  refreshCredits: () => Promise<void>;
  deductCredits: (amount: number) => void; // Optimistic update
}

const CreditContext = createContext<CreditContextType | undefined>(undefined);

interface CreditProviderProps {
  children: React.ReactNode;
  initialUsedGenerations: number;
  initialAvailableGenerations: number;
}

export function CreditProvider({
  children,
  initialUsedGenerations,
  initialAvailableGenerations,
}: CreditProviderProps) {
  const router = useRouter();
  const [usedGenerations, setUsedGenerations] = useState(initialUsedGenerations);
  const [availableGenerations, setAvailableGenerations] = useState(initialAvailableGenerations);
  const [isLoading, setIsLoading] = useState(false);

  const remainingCredits = availableGenerations - usedGenerations;

  // Refresh credits from server
  const refreshCredits = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/generations', {
        method: 'GET',
        cache: 'no-store', // Don't cache credit balance
      });

      if (response.ok) {
        const data = await response.json();
        setUsedGenerations(data.used || 0);
        setAvailableGenerations(data.available || 0);
        
        console.log('[CreditContext] Credits refreshed:', {
          used: data.used,
          available: data.available,
          remaining: data.remaining,
        });
      } else {
        console.error('[CreditContext] Failed to refresh credits:', response.status);
      }
    } catch (error) {
      console.error('[CreditContext] Error refreshing credits:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Optimistic credit deduction (UI updates immediately)
  const deductCredits = useCallback((amount: number) => {
    setUsedGenerations((prev) => prev + amount);
    console.log('[CreditContext] Optimistic deduction:', {
      amount,
      newUsed: usedGenerations + amount,
      remaining: remainingCredits - amount,
    });
  }, [usedGenerations, remainingCredits]);

  // Sync with server-side props when they change
  useEffect(() => {
    setUsedGenerations(initialUsedGenerations);
    setAvailableGenerations(initialAvailableGenerations);
  }, [initialUsedGenerations, initialAvailableGenerations]);

  // Auto-refresh on window focus (user returns to tab)
  useEffect(() => {
    const handleFocus = () => {
      console.log('[CreditContext] Window focused, refreshing credits...');
      refreshCredits();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refreshCredits]);

  const value: CreditContextType = {
    usedGenerations,
    availableGenerations,
    remainingCredits,
    isLoading,
    refreshCredits,
    deductCredits,
  };

  return (
    <CreditContext.Provider value={value}>
      {children}
    </CreditContext.Provider>
  );
}

// Custom hook to use credit context
export function useCredits() {
  const context = useContext(CreditContext);
  if (context === undefined) {
    throw new Error('useCredits must be used within a CreditProvider');
  }
  return context;
}

// Hook for AI generation with automatic credit management
export function useAIGeneration() {
  const { deductCredits, refreshCredits, remainingCredits } = useCredits();
  const router = useRouter();

  const executeGeneration = useCallback(async <T,>(
    generationFn: () => Promise<T>,
    tokenCost: number,
    toolName: string
  ): Promise<{ success: boolean; data?: T; error?: string }> => {
    // Check if user has enough credits
    if (remainingCredits < tokenCost) {
      console.error('[useAIGeneration] Insufficient credits:', {
        required: tokenCost,
        available: remainingCredits,
      });
      return {
        success: false,
        error: `Insufficient credits. Need ${tokenCost}, have ${remainingCredits}.`,
      };
    }

    console.log('[useAIGeneration] Starting generation:', {
      tool: toolName,
      cost: tokenCost,
      remainingBefore: remainingCredits,
    });

    // Optimistic UI update
    deductCredits(tokenCost);

    try {
      // Execute the AI generation
      const result = await generationFn();

      console.log('[useAIGeneration] Generation successful:', {
        tool: toolName,
        cost: tokenCost,
      });

      // Refresh credits from server to get actual values
      await refreshCredits();

      // Also refresh the entire page to update server components
      router.refresh();

      return { success: true, data: result };
    } catch (error: any) {
      console.error('[useAIGeneration] Generation failed:', {
        tool: toolName,
        error: error.message,
      });

      // Revert optimistic update on error
      await refreshCredits();

      return {
        success: false,
        error: error.message || 'Generation failed',
      };
    }
  }, [remainingCredits, deductCredits, refreshCredits, router]);

  return { executeGeneration, remainingCredits };
}

