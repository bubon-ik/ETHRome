import { useState, useCallback } from 'react';
import { tokenService } from '@/lib/token-service';
import { 
  TokenSearchResult, 
  TokenInfoResponse,
  TokenSearchParams,
  TokenInfoParams,
  TokenListParams
} from '@/types';

export interface UseTokenSearchReturn {
  searchTokens: (params: TokenSearchParams) => Promise<TokenSearchResult[]>;
  getTokensInfo: (params: TokenInfoParams) => Promise<TokenInfoResponse>;
  getAllTokensInfo: (params: TokenListParams) => Promise<TokenSearchResult[]>;
  get1inchTokenList: (params: TokenListParams) => Promise<TokenSearchResult[]>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useTokenSearch(): UseTokenSearchReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const searchTokens = useCallback(async (params: TokenSearchParams): Promise<TokenSearchResult[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await tokenService.searchTokens(params);
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search tokens';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getTokensInfo = useCallback(async (params: TokenInfoParams): Promise<TokenInfoResponse> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await tokenService.getTokensInfo(params);
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get tokens info';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getAllTokensInfo = useCallback(async (params: TokenListParams): Promise<TokenSearchResult[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await tokenService.getAllTokensInfo(params);
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get all tokens info';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const get1inchTokenList = useCallback(async (params: TokenListParams): Promise<TokenSearchResult[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await tokenService.get1inchTokenList(params);
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get 1inch token list';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    searchTokens,
    getTokensInfo,
    getAllTokensInfo,
    get1inchTokenList,
    isLoading,
    error,
    clearError,
  };
}

