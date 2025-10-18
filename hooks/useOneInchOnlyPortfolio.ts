import { useState, useCallback } from 'react';
import { oneInchOnlyPortfolioService } from '@/lib/oneinch-only-portfolio-service';
import { 
  PortfolioData,
  PortfolioParams
} from '@/types';

export interface UseOneInchOnlyPortfolioReturn {
  getPortfolioData: (params: PortfolioParams) => Promise<PortfolioData | null>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useOneInchOnlyPortfolio(): UseOneInchOnlyPortfolioReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getPortfolioData = useCallback(async (params: PortfolioParams): Promise<PortfolioData | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await oneInchOnlyPortfolioService.getPortfolioData(params);
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get portfolio data via 1inch API';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    getPortfolioData,
    isLoading,
    error,
    clearError,
  };
}


