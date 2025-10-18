import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { 
  ChartBarIcon, 
  CurrencyDollarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useOneInchOnlyPortfolio } from '@/hooks/useOneInchOnlyPortfolio';
import { PortfolioToken, PortfolioSummary } from '@/types';

interface OneInchOnlyPortfolioViewProps {
  className?: string;
}

const TokenCard: React.FC<{ token: PortfolioToken }> = ({ token }) => {
  const isPositive = (token.change24hPercent || 0) >= 0;
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white/10 dark:bg-black/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 dark:border-white/10 hover:border-white/30 dark:hover:border-white/20 transition-all duration-200"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          {token.logoURI && (
            <img
              src={token.logoURI}
              alt={token.symbol}
              className="w-10 h-10 rounded-full"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
              {token.symbol}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {token.name}
            </p>
          </div>
        </div>
        
        {token.change24hPercent !== undefined && token.change24hPercent !== 0 && (
          <div className={`flex items-center space-x-1 text-sm ${
            isPositive ? 'text-green-500' : 'text-red-500'
          }`}>
            {isPositive ? (
              <ArrowUpIcon className="w-4 h-4" />
            ) : (
              <ArrowDownIcon className="w-4 h-4" />
            )}
            <span>{Math.abs(token.change24hPercent).toFixed(2)}%</span>
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Balance</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {token.balanceFormatted}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Price</span>
          <span className="font-medium text-gray-900 dark:text-white">
            ${token.price.toFixed(6)}
          </span>
        </div>
        
        <div className="flex justify-between items-center pt-2 border-t border-white/20 dark:border-white/10">
          <span className="text-sm text-gray-600 dark:text-gray-400">Value</span>
          <span className="font-bold text-lg text-gray-900 dark:text-white">
            {token.valueFormatted}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

const PortfolioSummaryCard: React.FC<{ summary: PortfolioSummary }> = ({ summary }) => {
  const isPositive = summary.change24hPercent >= 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm rounded-xl p-6 border border-white/20 dark:border-white/10 mb-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
            <CurrencyDollarIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Portfolio Value
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {summary.tokenCount} tokens
            </p>
          </div>
        </div>
        
        {summary.change24hPercent !== 0 && (
          <div className={`flex items-center space-x-2 ${
            isPositive ? 'text-green-500' : 'text-red-500'
          }`}>
            {isPositive ? (
              <ArrowUpIcon className="w-5 h-5" />
            ) : (
              <ArrowDownIcon className="w-5 h-5" />
            )}
            <span className="font-semibold">
              {Math.abs(summary.change24hPercent).toFixed(2)}%
            </span>
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <div className="text-3xl font-bold text-gray-900 dark:text-white">
          {summary.totalValueFormatted}
        </div>
        
        {summary.change24h !== 0 && (
          <div className={`text-sm ${
            isPositive ? 'text-green-500' : 'text-red-500'
          }`}>
            {isPositive ? '+' : ''}${summary.change24h.toFixed(2)} (24h)
          </div>
        )}
      </div>
    </motion.div>
  );
};

export const OneInchOnlyPortfolioView: React.FC<OneInchOnlyPortfolioViewProps> = ({ className = "" }) => {
  const { address, isConnected } = useAccount();
  const { getPortfolioData, isLoading, error, clearError } = useOneInchOnlyPortfolio();
  const [portfolioData, setPortfolioData] = useState<any>(null);
  const [showZeroBalances, setShowZeroBalances] = useState(false);

  useEffect(() => {
    if (isConnected && address) {
      loadPortfolio();
    }
  }, [isConnected, address]);

  const loadPortfolio = async () => {
    if (!address) return;
    
    try {
      clearError();
      console.log('Loading portfolio data using only 1inch API for:', address);
      const data = await getPortfolioData({
        chainId: 8453,
        address,
        currency: 'USD'
      });
      
      if (data) {
        console.log('Portfolio data loaded via 1inch API:', data);
        setPortfolioData(data);
      } else {
        console.log('No portfolio data received from 1inch API');
        setPortfolioData({
          tokens: [],
          summary: {
            totalValue: 0,
            totalValueFormatted: '$0.00',
            change24h: 0,
            change24hPercent: 0,
            tokenCount: 0,
            currency: 'USD'
          },
          history: []
        });
      }
    } catch (err) {
      console.error('Failed to load portfolio via 1inch API:', err);
      setPortfolioData({
        tokens: [],
        summary: {
          totalValue: 0,
          totalValueFormatted: '$0.00',
          change24h: 0,
          change24hPercent: 0,
          tokenCount: 0,
          currency: 'USD'
        },
        history: []
      });
    }
  };

  const filteredTokens = portfolioData?.tokens?.filter((token: PortfolioToken) => 
    showZeroBalances || parseFloat(token.balance) > 0
  ) || [];

  if (!isConnected) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <ChartBarIcon className="w-8 h-8 text-gray-400 dark:text-gray-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Connect Wallet to View Portfolio
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Connect your wallet to see your token balances powered by 1inch API
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Loading Portfolio...
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Fetching data via 1inch API
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <ChartBarIcon className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Failed to Load Portfolio
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {error}
        </p>
        <button
          onClick={loadPortfolio}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!portfolioData) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <ChartBarIcon className="w-8 h-8 text-gray-400 dark:text-gray-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Portfolio Data
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Unable to load portfolio data via 1inch API. Please try again.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Portfolio Summary */}
      <PortfolioSummaryCard summary={portfolioData.summary} />
      
      {/* 1inch API Status */}
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
            <ChartBarIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h4 className="font-medium text-blue-800 dark:text-blue-200">
              1inch API Only
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Portfolio data powered exclusively by 1inch Token API and Quote API.
            </p>
          </div>
        </div>
      </div>
      
      {/* Controls */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Token Holdings ({filteredTokens.length})
        </h3>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowZeroBalances(!showZeroBalances)}
            className="flex items-center space-x-2 px-3 py-2 bg-white/10 dark:bg-black/10 rounded-lg hover:bg-white/20 dark:hover:bg-black/20 transition-colors"
          >
            {showZeroBalances ? (
              <EyeSlashIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            ) : (
              <EyeIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            )}
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {showZeroBalances ? 'Hide' : 'Show'} Zero Balances
            </span>
          </button>
          
          <button
            onClick={loadPortfolio}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
          >
            <ArrowPathIcon className="w-4 h-4" />
            <span className="text-sm">Refresh</span>
          </button>
        </div>
      </div>
      
      {/* Token Grid */}
      {filteredTokens.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTokens.map((token: PortfolioToken) => (
            <TokenCard key={token.address} token={token} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <CurrencyDollarIcon className="w-8 h-8 text-gray-400 dark:text-gray-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Tokens Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {showZeroBalances 
              ? 'No tokens in your portfolio' 
              : 'No tokens with non-zero balances'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default OneInchOnlyPortfolioView;