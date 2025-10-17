import React from 'react';
import { ArrowsUpDownIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import TokenSelector from './TokenSelector';
import AmountInput from './AmountInput';
import { SwapRoute as SwapRouteType } from '@/types';
import { useTokenBalance } from '@/hooks/useTokenBalance';

interface SwapRouteProps {
  route: SwapRouteType;
  index: number;
  onUpdate: (route: SwapRouteType) => void;
  onRemove: () => void;
  onSwap: () => void;
  canRemove: boolean;
}

const SwapRoute: React.FC<SwapRouteProps> = ({
  route,
  index,
  onUpdate,
  onRemove,
  onSwap,
  canRemove,
}) => {
  const updateFromToken = (token: any) => {
    onUpdate({
      ...route,
      from: { ...token, amount: route.from.amount },
    });
  };

  const updateToToken = (token: any) => {
    onUpdate({
      ...route,
      to: { ...token, amount: route.to.amount },
    });
  };

  const updateFromAmount = (amount: string) => {
    onUpdate({
      ...route,
      from: { ...route.from, amount },
    });
  };

  const fromBalance = useTokenBalance(route.from);
  const toBalance = useTokenBalance(route.to);

  return (
    <div className="relative bg-white/20 dark:bg-black/20 backdrop-blur-xl rounded-xl lg:rounded-2xl p-3 sm:p-4 border border-white/30 dark:border-white/10 shadow-xl">
      {/* Route Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
          Swap #{index + 1}
        </span>
        {canRemove && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onRemove}
            className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors duration-200 hover:bg-red-500/10 rounded-lg"
          >
            <XMarkIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </motion.button>
        )}
      </div>

      {/* From Token */}
      <div className="space-y-2 sm:space-y-3">
        <div className="bg-white/30 dark:bg-black/30 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/40 dark:border-white/20">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">From</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              <span className="hidden sm:inline">Balance: </span>
              {fromBalance.isLoading ? '...' : fromBalance.formatted}
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <TokenSelector
              selectedToken={route.from}
              onSelect={updateFromToken}
            />
            <AmountInput
              value={route.from.amount}
              onChange={updateFromAmount}
              placeholder="0.0"
            />
          </div>
        </div>

        {/* Swap Arrow */}
        <div className="flex justify-center">
          <motion.button
            whileHover={{ scale: 1.1, rotate: 180 }}
            whileTap={{ scale: 0.9 }}
            onClick={onSwap}
            className="p-2 sm:p-3 bg-white/40 dark:bg-black/40 border-2 border-white/50 dark:border-white/30 rounded-full hover:border-blue-400/50 dark:hover:border-blue-500/50 transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-sm"
          >
            <ArrowsUpDownIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300" />
          </motion.button>
        </div>

        {/* To Token */}
        <div className="bg-white/30 dark:bg-black/30 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/40 dark:border-white/20">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">To</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              <span className="hidden sm:inline">Balance: </span>
              {toBalance.isLoading ? '...' : toBalance.formatted}
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <TokenSelector
              selectedToken={route.to}
              onSelect={updateToToken}
            />
            <div className="flex-1">
              <input
                type="text"
                value={route.to.amount || ''}
                placeholder="0.0"
                className="w-full bg-transparent text-right text-base sm:text-lg font-semibold outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                readOnly
              />
            </div>
          </div>
        </div>
      </div>

      {/* Route Info */}
      {route.route && (
        <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-blue-50 dark:bg-gray-700 rounded-lg border border-blue-200 dark:border-gray-600 transition-colors duration-300">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-gray-600 dark:text-gray-300 transition-colors duration-300">Route</span>
            <span className="text-blue-600 dark:text-blue-400 font-medium transition-colors duration-300">
              {route.route.length} hop{route.route.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs sm:text-sm mt-1">
            <span className="text-gray-600 dark:text-gray-300 transition-colors duration-300">Est. Gas</span>
            <span className="text-gray-900 dark:text-white font-medium transition-colors duration-300">{route.gas} GWEI</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SwapRoute;
