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
    <div className="relative bg-gray-50 rounded-2xl p-4 border border-gray-200">
      {/* Route Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-600">
          Swap #{index + 1}
        </span>
        {canRemove && (
          <button
            onClick={onRemove}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* From Token */}
      <div className="space-y-3">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">From</span>
            <span className="text-xs text-gray-400">Balance: {fromBalance.isLoading ? '...' : fromBalance.formatted}</span>
          </div>
          <div className="flex items-center gap-3">
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
          <button
            onClick={onSwap}
            className="p-2 bg-white border-2 border-gray-200 rounded-full hover:border-blue-300 transition-colors"
          >
            <ArrowsUpDownIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* To Token */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">To</span>
            <span className="text-xs text-gray-400">Balance: {toBalance.isLoading ? '...' : toBalance.formatted}</span>
          </div>
          <div className="flex items-center gap-3">
            <TokenSelector
              selectedToken={route.to}
              onSelect={updateToToken}
            />
            <div className="flex-1">
              <input
                type="text"
                value={route.to.amount || ''}
                placeholder="0.0"
                className="w-full bg-transparent text-right text-lg font-semibold outline-none"
                readOnly
              />
            </div>
          </div>
        </div>
      </div>

      {/* Route Info */}
      {route.route && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Route</span>
            <span className="text-blue-600 font-medium">
              {route.route.length} hop{route.route.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-gray-600">Est. Gas</span>
            <span className="text-gray-900 font-medium">{route.gas} GWEI</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SwapRoute;
