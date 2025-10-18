import React, { useState, useEffect, useMemo } from 'react';
import { useTokenSearch } from '@/hooks/useTokenSearch';
import { TokenSearchResult } from '@/types';

interface TokenSearchProps {
  onTokenSelect?: (token: TokenSearchResult) => void;
  placeholder?: string;
  className?: string;
  showAllTokens?: boolean;
  limit?: number;
}

export function TokenSearch({ 
  onTokenSelect, 
  placeholder = "Search tokens...", 
  className = "",
  showAllTokens = false,
  limit = 10
}: TokenSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedToken, setSelectedToken] = useState<TokenSearchResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  
  const { 
    searchTokens, 
    getAllTokensInfo, 
    get1inchTokenList,
    isLoading, 
    error, 
    clearError 
  } = useTokenSearch();

  const [tokens, setTokens] = useState<TokenSearchResult[]>([]);

  // Загружаем все токены при монтировании компонента
  useEffect(() => {
    const loadAllTokens = async () => {
      try {
        const allTokens = await getAllTokensInfo({ chainId: 8453 });
        setTokens(allTokens);
      } catch (err) {
        console.error('Failed to load tokens:', err);
      }
    };

    if (showAllTokens) {
      loadAllTokens();
    }
  }, [showAllTokens, getAllTokensInfo]);

  // Фильтруем токены на основе поискового запроса
  const filteredTokens = useMemo(() => {
    if (!searchQuery.trim()) {
      return showAllTokens ? tokens : [];
    }

    return tokens.filter(token => 
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.address.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, limit);
  }, [tokens, searchQuery, showAllTokens, limit]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setShowResults(false);
      return;
    }

    try {
      clearError();
      const results = await searchTokens({
        query,
        chainId: 8453,
        limit,
        ignoreListed: false
      });
      
      setTokens(results);
      setShowResults(true);
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  const handleTokenSelect = (token: TokenSearchResult) => {
    setSelectedToken(token);
    setShowResults(false);
    setSearchQuery(token.symbol);
    onTokenSelect?.(token);
  };

  const handleInputFocus = () => {
    if (searchQuery.trim() || showAllTokens) {
      setShowResults(true);
    }
  };

  const handleInputBlur = () => {
    // Задержка для обработки клика по результату
    setTimeout(() => setShowResults(false), 200);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
        />
        
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {showResults && (filteredTokens.length > 0 || isLoading) && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2">Searching tokens...</p>
            </div>
          ) : (
            <div className="py-2">
              {filteredTokens.map((token) => (
                <button
                  key={token.address}
                  onClick={() => handleTokenSelect(token)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-150 flex items-center space-x-3"
                >
                  {token.logoURI && (
                    <img
                      src={token.logoURI}
                      alt={token.symbol}
                      className="w-8 h-8 rounded-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900 truncate">
                        {token.symbol}
                      </span>
                      {token.verified && (
                        <span className="text-blue-500 text-xs">✓</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {token.name}
                    </p>
                    <p className="text-xs text-gray-400 font-mono truncate">
                      {token.address}
                    </p>
                  </div>
                  {token.tags && token.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {token.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
              
              {filteredTokens.length === 0 && !isLoading && (
                <div className="p-4 text-center text-gray-500">
                  <p>No tokens found</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {selectedToken && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-3">
            {selectedToken.logoURI && (
              <img
                src={selectedToken.logoURI}
                alt={selectedToken.symbol}
                className="w-8 h-8 rounded-full"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            <div>
              <p className="font-medium text-blue-900">
                {selectedToken.symbol} - {selectedToken.name}
              </p>
              <p className="text-sm text-blue-600 font-mono">
                {selectedToken.address}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

