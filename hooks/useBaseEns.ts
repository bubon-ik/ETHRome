import { useState, useCallback } from 'react';
import { useEnsName, useEnsAddress } from 'wagmi';
import { base } from 'wagmi/chains';

export interface UseBaseEnsReturn {
  resolveEnsName: (address: string) => Promise<string | null>;
  resolveEnsAddress: (name: string) => Promise<string | null>;
  validateBaseEnsName: (name: string) => boolean;
  isLoading: boolean;
  error: string | null;
}

export function useBaseEns(): UseBaseEnsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateBaseEnsName = useCallback((name: string): boolean => {
    // Check if it's a valid .base.eth domain
    const baseEnsRegex = /^[a-zA-Z0-9-]+\.base\.eth$/;
    return baseEnsRegex.test(name);
  }, []);

  const resolveEnsName = useCallback(async (address: string): Promise<string | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use wagmi's useEnsName hook for Base network
      // This will be handled by the component using this hook
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resolve ENS name';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resolveEnsAddress = useCallback(async (name: string): Promise<string | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Validate that it's a .base.eth domain
      if (!validateBaseEnsName(name)) {
        throw new Error('Invalid .base.eth domain format');
      }

      // Use wagmi's useEnsAddress hook for Base network
      // This will be handled by the component using this hook
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resolve ENS address';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [validateBaseEnsName]);

  return {
    resolveEnsName,
    resolveEnsAddress,
    validateBaseEnsName,
    isLoading,
    error,
  };
}

// Hook for resolving ENS addresses on Base network
export function useBaseEnsAddress(name: string | undefined) {
  return useEnsAddress({
    name: name || undefined,
    chainId: base.id,
  });
}

// Hook for resolving ENS names on Base network
export function useBaseEnsName(address: `0x${string}` | undefined) {
  return useEnsName({
    address: address || undefined,
    chainId: base.id,
  });
}
