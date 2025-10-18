'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowsUpDownIcon, 
  TrashIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Token } from '@/types';
import { BASE_TOKENS } from '@/lib/wagmi';

interface LimitOrderRoute {
  from: Token & { amount: string };
  to: Token & { amount: string };
  targetPrice: string;
  expiration: string;
  partialFillEnabled: boolean;
}

interface LimitOrderRouteProps {
  order: LimitOrderRoute;
  index: number;
  isActive: boolean;
  onUpdate: (updates: Partial<LimitOrderRoute>) => void;
  onRemove: () => void;
  onSwap: () => void;
  onClick: () => void;
  showRemove: boolean;
}

const LimitOrderRouteComponent: React.FC<LimitOrderRouteProps> = ({
  order,
  index,
  isActive,
  onUpdate,
  onRemove,
  onSwap,
  onClick,
  showRemove
}) => {
  const isValid = order.from.amount && order.targetPrice;
  const estimatedReceive = order.from.amount && order.targetPrice 
    ? (parseFloat(order.from.amount) * parseFloat(order.targetPrice)).toFixed(4)
    : '0.00';

  const getCurrentMarketPrice = () => {
    // Mock market price - in real implementation, fetch from 1inch or other price source
    return '1.2345';
  };

  const marketPrice = getCurrentMarketPrice();
  const priceImpact = order.targetPrice && marketPrice
    ? ((parseFloat(order.targetPrice) - parseFloat(marketPrice)) / parseFloat(marketPrice) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={`liquid-glass rounded-2xl p-6 cursor-pointer transition-all duration-200 ${
        isActive 
          ? 'ring-2 ring-blue-400 bg-blue-500/10 shadow-lg scale-[1.02]' 
          : 'hover:bg-white/10 hover:scale-[1.01]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
            isValid ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
          }`}>
            {isValid ? (
              <CheckCircleIcon className="w-5 h-5" />
            ) : (
              <ExclamationTriangleIcon className="w-5 h-5" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Limit Order #{index + 1}
            </h3>
            <p className="text-sm text-gray-600 dark:text-white/60">
              {order.expiration} • {order.partialFillEnabled ? 'Partial fills' : 'Fill or kill'}
            </p>
          </div>
        </div>

        {showRemove && (
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10"
          >
            <TrashIcon className="w-5 h-5" />
          </motion.button>
        )}
      </div>

      {/* Token Pair */}
      <div className="space-y-4">
        {/* From Token */}
        <div className="liquid-glass rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                {order.from.symbol.slice(0, 2)}
              </div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {order.from.symbol}
                </div>
                <div className="text-xs text-gray-500 dark:text-white/50">
                  {order.from.name}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {order.from.amount || '0.00'}
              </div>
              <div className="text-xs text-gray-500 dark:text-white/50">
                You're selling
              </div>
            </div>
          </div>
        </div>

        {/* Swap Arrow */}
        <div className="flex justify-center -my-2 relative z-10">
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onSwap();
            }}
            whileHover={{ scale: 1.1, rotate: 180 }}
            whileTap={{ scale: 0.9 }}
            className="w-8 h-8 liquid-glass rounded-lg flex items-center justify-center border-2 border-white dark:border-gray-900 bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg"
          >
            <ArrowsUpDownIcon className="w-4 h-4" />
          </motion.button>
        </div>

        {/* To Token */}
        <div className="liquid-glass rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                {order.to.symbol.slice(0, 2)}
              </div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {order.to.symbol}
                </div>
                <div className="text-xs text-gray-500 dark:text-white/50">
                  {order.to.name}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {estimatedReceive}
              </div>
              <div className="text-xs text-gray-500 dark:text-white/50">
                Minimum receive
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Price Info */}
      {order.targetPrice && (
        <div className="mt-4 space-y-3">
          <div className="liquid-glass rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-white/80">
                Target Price
              </span>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {order.targetPrice} {order.to.symbol}/{order.from.symbol}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-white/60">
                Market Price: {marketPrice}
              </span>
              <span className={`font-medium ${
                priceImpact > 0 ? 'text-green-400' : priceImpact < 0 ? 'text-red-400' : 'text-gray-400'
              }`}>
                {priceImpact > 0 ? '+' : ''}{priceImpact.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Order Status */}
      <div className="mt-4 flex items-center gap-2 text-sm">
        <ClockIcon className="w-4 h-4 text-gray-500 dark:text-white/50" />
        <span className="text-gray-600 dark:text-white/60">
          {isValid ? 'Ready to submit' : 'Missing required fields'}
        </span>
      </div>
    </motion.div>
  );
};

export default LimitOrderRouteComponent;
