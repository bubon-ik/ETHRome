import { useState, useCallback } from 'react';
import { realPortfolioService } from '@/lib/real-portfolio-service';
import { 
  PortfolioData,
  PortfolioParams
} from '@/types';

export interface UseRealPortfolioReturn {
  getRealPortfolioData: (params: PortfolioParams) => Promise<PortfolioData | null>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useRealPortfolio(): UseRealPortfolioReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getRealPortfolioData = useCallback(async (params: PortfolioParams): Promise<PortfolioData | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await realPortfolioService.getRealPortfolioData(params);
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get real portfolio data';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    getRealPortfolioData,
    isLoading,
    error,
    clearError,
  };
}


