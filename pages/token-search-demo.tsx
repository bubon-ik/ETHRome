import React, { useState } from 'react';
import { TokenSearch } from '@/components/TokenSearch';
import { TokenSearchResult } from '@/types';
import { tokenService } from '@/lib/token-service';

export default function TokenSearchDemo() {
  const [selectedToken, setSelectedToken] = useState<TokenSearchResult | null>(null);
  const [allTokens, setAllTokens] = useState<TokenSearchResult[]>([]);
  const [isLoadingAllTokens, setIsLoadingAllTokens] = useState(false);
  const [searchResults, setSearchResults] = useState<TokenSearchResult[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleTokenSelect = (token: TokenSearchResult) => {
    setSelectedToken(token);
  };

  const loadAllTokens = async () => {
    setIsLoadingAllTokens(true);
    setError(null);
    
    try {
      const tokens = await tokenService.getAllTokensInfo({ chainId: 8453 });
      setAllTokens(tokens);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tokens');
    } finally {
      setIsLoadingAllTokens(false);
    }
  };

  const searchTokens = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoadingSearch(true);
    setError(null);
    
    try {
      const results = await tokenService.searchTokens({
        query: searchQuery,
        chainId: 8453,
        limit: 20,
        ignoreListed: false
      });
      setSearchResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search tokens');
    } finally {
      setIsLoadingSearch(false);
    }
  };

  const getTokenInfo = async () => {
    if (!selectedToken) return;
    
    try {
      const info = await tokenService.getTokensInfo({
        chainId: 8453,
        addresses: [selectedToken.address]
      });
      console.log('Token info:', info);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get token info');
    }
  };

  const features = tokenService.getFeatures();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Token Search - Base Network
          </h1>
          
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h2 className="text-lg font-semibold text-green-900 mb-2">Service Status</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Token Search:</span> 
                <span className="ml-2 text-green-600">✓ Available</span>
              </div>
              <div>
                <span className="font-medium">Token Info:</span> 
                <span className="ml-2 text-green-600">✓ Available</span>
              </div>
              <div>
                <span className="font-medium">Token Lists:</span> 
                <span className="ml-2 text-green-600">✓ Available</span>
              </div>
              <div>
                <span className="font-medium">Rate Limit:</span> 
                <span className="ml-2 text-gray-600">High (100 rps)</span>
              </div>
            </div>
            <p className="mt-2 text-sm text-green-600">
              ✅ Connected to 1inch API with real-time data from Base network
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

            <div className="space-y-8">
            {/* Token Search Component */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Real-time Token Search
              </h2>
              <TokenSearch
                onTokenSelect={handleTokenSelect}
                placeholder="Search for tokens on Base..."
                className="max-w-md"
                showAllTokens={true}
                limit={15}
              />
            </div>

            {/* Manual Search */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Manual Search
              </h2>
              <div className="flex space-x-4 mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter token symbol or name..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={searchTokens}
                  disabled={isLoadingSearch || !searchQuery.trim()}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingSearch ? 'Searching...' : 'Search'}
                </button>
              </div>
              
              {searchResults.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Search Results:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {searchResults.map((token) => (
                      <div
                        key={token.address}
                        className="p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 cursor-pointer transition-colors"
                        onClick={() => setSelectedToken(token)}
                      >
                        <div className="flex items-center space-x-3">
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
                            <p className="font-medium text-gray-900 truncate">
                              {token.symbol}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {token.name}
                            </p>
                          </div>
                          {token.verified && (
                            <span className="text-blue-500 text-sm">✓</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Load All Tokens */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Load All Tokens
              </h2>
              <button
                onClick={loadAllTokens}
                disabled={isLoadingAllTokens}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingAllTokens ? 'Loading...' : 'Load All Tokens'}
              </button>
              
              {allTokens.length > 0 && (
                <div className="mt-4 bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">
                    All Tokens ({allTokens.length}):
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                    {allTokens.map((token) => (
                      <div
                        key={token.address}
                        className="p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 cursor-pointer transition-colors"
                        onClick={() => setSelectedToken(token)}
                      >
                        <div className="flex items-center space-x-3">
                          {token.logoURI && (
                            <img
                              src={token.logoURI}
                              alt={token.symbol}
                              className="w-6 h-6 rounded-full"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm truncate">
                              {token.symbol}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {token.name}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Selected Token Info */}
            {selectedToken && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-blue-900 mb-4">
                  Selected Token
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center space-x-4 mb-4">
                      {selectedToken.logoURI && (
                        <img
                          src={selectedToken.logoURI}
                          alt={selectedToken.symbol}
                          className="w-12 h-12 rounded-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-blue-900">
                          {selectedToken.symbol}
                        </h3>
                        <p className="text-blue-700">{selectedToken.name}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Address:</span>
                        <p className="font-mono text-gray-600 break-all">
                          {selectedToken.address}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Decimals:</span>
                        <span className="ml-2 text-gray-600">{selectedToken.decimals}</span>
                      </div>
                      {selectedToken.tags && selectedToken.tags.length > 0 && (
                        <div>
                          <span className="font-medium text-gray-700">Tags:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedToken.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col justify-center">
                    <button
                      onClick={getTokenInfo}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Get Detailed Info
                    </button>
                    <p className="mt-2 text-sm text-gray-600">
                      Click to fetch detailed token information from 1inch API
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
