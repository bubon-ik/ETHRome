'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  ClockIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

interface LimitOrderRoute {
  from: { symbol: string; amount: string };
  to: { symbol: string; amount: string };
  targetPrice: string;
  expiration: string;
  partialFillEnabled: boolean;
}

interface BatchLimitOrderButtonProps {
  orders: LimitOrderRoute[];
  onSubmit: () => void;
  loading?: boolean;
  error?: string | null;
}

const BatchLimitOrderButton: React.FC<BatchLimitOrderButtonProps> = ({
  orders,
  onSubmit,
  loading = false,
  error = null
}) => {
  const validOrders = orders.filter(order => 
    order.from.amount && order.to.amount && order.targetPrice
  );
  
  const totalValue = validOrders.reduce((sum, order) => {
    return sum + (parseFloat(order.from.amount) || 0);
  }, 0);

  const isDisabled = loading || validOrders.length === 0;

  const getButtonText = () => {
    if (loading) return 'Creating Orders...';
    if (validOrders.length === 0) return 'Complete Order Details';
    if (validOrders.length === 1) return 'Create Limit Order';
    return `Create ${validOrders.length} Limit Orders`;
  };

  const getButtonIcon = () => {
    if (loading) {
      return (
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      );
    }
    if (validOrders.length === 0) {
      return <ExclamationTriangleIcon className="w-5 h-5" />;
    }
    return <ClockIcon className="w-5 h-5" />;
  };

  return (
    <div className="space-y-4">
      {/* Order Summary */}
      <div className="liquid-glass rounded-2xl p-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-500/20 rounded-xl mb-2 mx-auto">
              <ClockIcon className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {orders.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-white/60">
              Total Orders
            </div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center w-10 h-10 bg-green-500/20 rounded-xl mb-2 mx-auto">
              <CheckCircleIcon className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {validOrders.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-white/60">
              Valid Orders
            </div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center w-10 h-10 bg-purple-500/20 rounded-xl mb-2 mx-auto">
              <CurrencyDollarIcon className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalValue.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600 dark:text-white/60">
              Total Value
            </div>
          </div>
        </div>
      </div>

      {/* Invalid Orders Warning */}
      {orders.length > validOrders.length && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="liquid-glass border-l-4 border-yellow-400 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                {orders.length - validOrders.length} incomplete order{orders.length - validOrders.length !== 1 ? 's' : ''}
              </div>
              <div className="text-sm text-gray-600 dark:text-white/60">
                Complete all fields to include in batch submission
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="liquid-glass border-l-4 border-red-400 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div>
              <div className="font-medium text-red-400">
                Failed to create orders
              </div>
              <div className="text-sm text-red-300">
                {error}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Submit Button */}
      <motion.button
        onClick={onSubmit}
        disabled={isDisabled}
        whileHover={!isDisabled ? { scale: 1.02, y: -2 } : {}}
        whileTap={!isDisabled ? { scale: 0.98 } : {}}
        className={`w-full liquid-glass-button p-6 text-xl font-bold rounded-2xl transition-all duration-200 ${
          isDisabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:shadow-2xl hover:shadow-blue-500/25'
        }`}
      >
        <div className="flex items-center justify-center gap-3">
          {getButtonIcon()}
          {getButtonText()}
        </div>
      </motion.button>

      {/* Gas Estimate */}
      {validOrders.length > 0 && (
        <div className="text-center text-sm text-gray-600 dark:text-white/60">
          <div className="flex items-center justify-center gap-2">
            <span>Estimated gas:</span>
            <span className="font-medium">
              ~{(validOrders.length * 0.002).toFixed(4)} ETH
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchLimitOrderButton;
