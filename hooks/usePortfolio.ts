import { useState, useCallback } from 'react';
import { portfolioService } from '@/lib/portfolio-service';
import { 
  PortfolioToken, 
  PortfolioSummary, 
  PortfolioHistory,
  PortfolioData,
  PortfolioParams
} from '@/types';

export interface UsePortfolioReturn {
  getPortfolioBalances: (params: PortfolioParams) => Promise<PortfolioToken[]>;
  getPortfolioSummary: (params: PortfolioParams) => Promise<PortfolioSummary | null>;
  getPortfolioHistory: (params: PortfolioParams) => Promise<PortfolioHistory[]>;
  getPortfolioData: (params: PortfolioParams) => Promise<PortfolioData | null>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function usePortfolio(): UsePortfolioReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getPortfolioBalances = useCallback(async (params: PortfolioParams): Promise<PortfolioToken[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await portfolioService.getPortfolioBalances(params);
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get portfolio balances';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getPortfolioSummary = useCallback(async (params: PortfolioParams): Promise<PortfolioSummary | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await portfolioService.getPortfolioSummary(params);
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get portfolio summary';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getPortfolioHistory = useCallback(async (params: PortfolioParams): Promise<PortfolioHistory[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await portfolioService.getPortfolioHistory(params);
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get portfolio history';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getPortfolioData = useCallback(async (params: PortfolioParams): Promise<PortfolioData | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await portfolioService.getPortfolioData(params);
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get portfolio data';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    getPortfolioBalances,
    getPortfolioSummary,
    getPortfolioHistory,
    getPortfolioData,
    isLoading,
    error,
    clearError,
  };
}
