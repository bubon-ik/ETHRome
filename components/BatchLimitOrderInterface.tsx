'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlusIcon, 
  ArrowsUpDownIcon, 
  Cog6ToothIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  ClockIcon,
  TrashIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import { useLimitOrder } from '@/hooks/useLimitOrder';
import { useBatchLimitOrder } from '@/hooks/useBatchLimitOrder';
import { BASE_TOKENS } from '@/lib/wagmi';
import { Token } from '@/types';
import { useAccount } from 'wagmi';

interface LimitOrderRoute {
  from: Token & { amount: string };
  to: Token & { amount: string };
  targetPrice: string;
  expiration: string;
  partialFillEnabled: boolean;
}

const BatchLimitOrderInterface: React.FC = () => {
  const { address } = useAccount();
  const [limitOrders, setLimitOrders] = useState<LimitOrderRoute[]>([
    {
      from: { ...BASE_TOKENS[0], amount: '' },
      to: { ...BASE_TOKENS[1], amount: '' },
      targetPrice: '',
      expiration: '1 Day',
      partialFillEnabled: true
    }
  ]);
  
  const [currentOrderIndex, setCurrentOrderIndex] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  
  // Use the new batch limit order hook with sendCalls
  const { 
    executeBatchLimitOrder, 
    resetState,
    isLoading: batchLoading, 
    error: batchError,
    txHash: batchTxHash,
    batchId,
    isSuccess: batchSuccess,
    callsCount
  } = useBatchLimitOrder();
  
  // Keep the old hook for backwards compatibility if needed
  const { createLimitOrder, loading: singleLoading, error: singleError } = useLimitOrder();
  
  // Use batch loading and error states
  const loading = batchLoading;
  const error = batchError;

  // Auto-reset state on success after delay
  useEffect(() => {
    if (batchSuccess) {
      const timer = setTimeout(() => {
        // Reset orders after successful submission
        setLimitOrders([{
          from: { ...BASE_TOKENS[0], amount: '' },
          to: { ...BASE_TOKENS[1], amount: '' },
          targetPrice: '',
          expiration: '1 Day',
          partialFillEnabled: true
        }]);
        setCurrentOrderIndex(0);
        resetState();
      }, 3000); // 3 second delay to show success message
      
      return () => clearTimeout(timer);
    }
  }, [batchSuccess, resetState]);

  // Auto-clear errors after some time
  useEffect(() => {
    if (batchError) {
      const isCancellation = batchError.includes('cancelled') || batchError.includes('canceled');
      const clearTime = isCancellation ? 8000 : 5000; // 8s for cancellations, 5s for errors

      const timer = setTimeout(() => {
        resetState();
      }, clearTime);
      return () => clearTimeout(timer);
    }
  }, [batchError, resetState]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle if no input is focused
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) {
        return;
      }
      
      if (e.key === 'ArrowLeft' && currentOrderIndex > 0) {
        setCurrentOrderIndex(prev => prev - 1);
      } else if (e.key === 'ArrowRight' && currentOrderIndex < limitOrders.length - 1) {
        setCurrentOrderIndex(prev => prev + 1);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [limitOrders.length, currentOrderIndex]);

  const addLimitOrder = useCallback(() => {
    setLimitOrders(prev => {
      const newOrder: LimitOrderRoute = {
        from: { ...BASE_TOKENS[0], amount: '' },
        to: { ...BASE_TOKENS[1], amount: '' },
        targetPrice: '',
        expiration: '1 Day',
        partialFillEnabled: true
      };
      const newOrders = [...prev, newOrder];
      setCurrentOrderIndex(newOrders.length - 1);
      return newOrders;
    });
  }, []);

  const removeLimitOrder = useCallback((index: number) => {
    if (limitOrders.length <= 1) return;
    
    setLimitOrders(prev => {
      const newOrders = prev.filter((_, i) => i !== index);
      if (currentOrderIndex >= newOrders.length) {
        setCurrentOrderIndex(newOrders.length - 1);
      } else if (currentOrderIndex > index) {
        setCurrentOrderIndex(prev => prev - 1);
      }
      return newOrders;
    });
  }, [limitOrders.length, currentOrderIndex]);

  const updateLimitOrder = useCallback((index: number, updates: Partial<LimitOrderRoute>) => {
    setLimitOrders(prev => prev.map((order, i) => 
      i === index ? { ...order, ...updates } : order
    ));
  }, []);

  const swapTokens = useCallback((index: number) => {
    setLimitOrders(prev => prev.map((order, i) => 
      i === index ? {
        ...order,
        from: order.to,
        to: order.from,
        targetPrice: order.targetPrice ? (1 / parseFloat(order.targetPrice)).toFixed(6) : ''
      } : order
    ));
  }, []);

  const calculateEstimatedReceive = (order: LimitOrderRoute) => {
    if (!order.from.amount || !order.targetPrice) return '0.00';
    return (parseFloat(order.from.amount) * parseFloat(order.targetPrice)).toFixed(4);
  };

  const handleBatchSubmit = async () => {
    if (!address) {
      return;
    }

    const validOrders = limitOrders.filter(order => 
      order.from.amount && 
      order.targetPrice &&
      parseFloat(order.from.amount) > 0 && 
      parseFloat(order.targetPrice) > 0
    );

    if (validOrders.length === 0) {
      return;
    }

    try {
      // Clear any previous error
      if (batchError) {
        resetState();
      }

      // Execute batch limit orders using sendCalls
      await executeBatchLimitOrder({
        orders: validOrders,
        walletAddress: address,
      });
      
    } catch (err) {
      console.error('Failed to create batch limit orders:', err);
    }
  };

  const currentOrder = limitOrders[currentOrderIndex];
  const validOrdersCount = limitOrders.filter(order => 
    order.from.amount && 
    order.targetPrice &&
    parseFloat(order.from.amount) > 0 && 
    parseFloat(order.targetPrice) > 0
  ).length;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold gradient-text mb-2">Batch Limit Orders</h2>
        <p className="text-gray-600 dark:text-white/60">Create multiple limit orders in a single transaction</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Orders List */}
        <div className="lg:col-span-1">
          <div className="liquid-glass-card h-fit">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Orders ({limitOrders.length})</h3>
              <button
                onClick={addLimitOrder}
                className="liquid-glass-button p-2 rounded-xl"
                title="Add Order"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {limitOrders.map((order, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`liquid-glass rounded-xl p-3 cursor-pointer transition-all duration-200 ${
                    index === currentOrderIndex 
                      ? 'ring-2 ring-blue-400 bg-blue-500/10' 
                      : 'hover:bg-white/10'
                  }`}
                  onClick={() => setCurrentOrderIndex(index)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {order.from.symbol} → {order.to.symbol}
                        </span>
                        {limitOrders.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeLimitOrder(index);
                            }}
                            className="text-red-400 hover:text-red-300 p-1"
                          >
                            <TrashIcon className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-white/60">
                        {order.from.amount || '0'} {order.from.symbol}
                      </div>
                      {order.targetPrice && (
                        <div className="text-xs text-green-400">
                          @ {order.targetPrice} {order.to.symbol}/{order.from.symbol}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className={`w-2 h-2 rounded-full ${
                        order.from.amount && order.targetPrice && 
                        parseFloat(order.from.amount) > 0 && parseFloat(order.targetPrice) > 0
                          ? 'bg-green-400' 
                          : 'bg-gray-400'
                      }`} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Order Editor */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentOrderIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="liquid-glass-card"
            >
              {/* Order Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <ClockIcon className="w-6 h-6 text-blue-400" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      Order #{currentOrderIndex + 1}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-white/60">
                      Set your target price and expiration
                    </p>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentOrderIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentOrderIndex === 0}
                    className="liquid-glass p-2 rounded-lg disabled:opacity-50"
                  >
                    <ChevronLeftIcon className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-600 dark:text-white/60 px-2">
                    {currentOrderIndex + 1} / {limitOrders.length}
                  </span>
                  <button
                    onClick={() => setCurrentOrderIndex(prev => Math.min(limitOrders.length - 1, prev + 1))}
                    disabled={currentOrderIndex === limitOrders.length - 1}
                    className="liquid-glass p-2 rounded-lg disabled:opacity-50"
                  >
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* From Token */}
              <div className="space-y-4 mb-4">
                <label className="block text-sm font-semibold text-gray-700 dark:text-white/80">
                  You're selling
                </label>
                <div className="liquid-glass rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <select
                      value={currentOrder.from.address}
                      onChange={(e) => {
                        const token = BASE_TOKENS.find(t => t.address === e.target.value);
                        if (token) {
                          updateLimitOrder(currentOrderIndex, {
                            from: { ...token, amount: currentOrder.from.amount }
                          });
                        }
                      }}
                      className="liquid-glass bg-transparent text-lg font-bold border-0 focus:ring-0"
                    >
                      {BASE_TOKENS.map(token => (
                        <option key={token.address} value={token.address} className="bg-gray-800 text-white">
                          {token.symbol}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      step="0.0001"
                      placeholder="0.0"
                      value={currentOrder.from.amount}
                      onChange={(e) => updateLimitOrder(currentOrderIndex, {
                        from: { ...currentOrder.from, amount: e.target.value }
                      })}
                      className="bg-transparent text-right text-2xl font-bold border-0 focus:ring-0 w-full max-w-[150px]"
                    />
                  </div>
                </div>
              </div>

              {/* Swap Direction */}
              <div className="flex justify-center -my-2 relative z-10">
                <motion.button
                  type="button"
                  onClick={() => swapTokens(currentOrderIndex)}
                  whileHover={{ scale: 1.1, rotate: 180 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-10 h-10 liquid-glass rounded-xl flex items-center justify-center border-4 border-white dark:border-gray-900 bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-xl"
                >
                  <ArrowsUpDownIcon className="w-5 h-5" />
                </motion.button>
              </div>

              {/* To Token */}
              <div className="space-y-4 mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-white/80">
                  You'll receive (minimum)
                </label>
                <div className="liquid-glass rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <select
                      value={currentOrder.to.address}
                      onChange={(e) => {
                        const token = BASE_TOKENS.find(t => t.address === e.target.value);
                        if (token) {
                          updateLimitOrder(currentOrderIndex, {
                            to: { ...token, amount: currentOrder.to.amount }
                          });
                        }
                      }}
                      className="liquid-glass bg-transparent text-lg font-bold border-0 focus:ring-0"
                    >
                      {BASE_TOKENS.map(token => (
                        <option key={token.address} value={token.address} className="bg-gray-800 text-white">
                          {token.symbol}
                        </option>
                      ))}
                    </select>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {calculateEstimatedReceive(currentOrder)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-white/50">
                        Estimated receive
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Target Price */}
              <div className="space-y-3 mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-white/80">
                  Target Price
                </label>
                <div className="liquid-glass rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      step="0.000001"
                      placeholder="0.000000"
                      value={currentOrder.targetPrice}
                      onChange={(e) => updateLimitOrder(currentOrderIndex, { targetPrice: e.target.value })}
                      className="bg-transparent text-lg font-bold border-0 focus:ring-0 flex-1"
                    />
                    <span className="text-sm text-gray-600 dark:text-white/60">
                      {currentOrder.to.symbol}/{currentOrder.from.symbol}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-white/80">
                    Expiration
                  </label>
                  <select
                    value={currentOrder.expiration}
                    onChange={(e) => updateLimitOrder(currentOrderIndex, { expiration: e.target.value })}
                    className="liquid-glass w-full p-3 bg-transparent border-0 focus:ring-0 rounded-xl"
                  >
                    <option className="bg-gray-800 text-white">1 Hour</option>
                    <option className="bg-gray-800 text-white">1 Day</option>
                    <option className="bg-gray-800 text-white">1 Week</option>
                    <option className="bg-gray-800 text-white">1 Month</option>
                    <option className="bg-gray-800 text-white">Never</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-white/80">
                    Partial Fill
                  </label>
                  <label className="flex items-center gap-3 liquid-glass p-3 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentOrder.partialFillEnabled}
                      onChange={(e) => updateLimitOrder(currentOrderIndex, { partialFillEnabled: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">Allow partial fills</span>
                  </label>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Batch Submit */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="liquid-glass-card"
      >
        {/* Batch Status Info */}
        <div className="mb-4 liquid-glass rounded-2xl p-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30">
          <div className="flex items-center gap-2">
            <span className="text-lg">⏰</span>
            <div>
              <div className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                Batch Limit Orders Mode
              </div>
              <div className="text-xs text-blue-800 dark:text-blue-100/90">
                Using wagmi sendCalls for batch limit order creation
                {callsCount > 0 && ` (${callsCount} calls prepared)`}
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Status */}
        {batchId && (
          <div className="mb-4 liquid-glass rounded-xl p-3">
            <div className="text-sm">
              <div className="font-medium text-gray-900 dark:text-white mb-1">
                Batch Status: {batchSuccess ? '✅ Success' : '⏳ Processing'}
              </div>
              <div className="text-xs text-gray-600 dark:text-white/60">
                Batch ID: {batchId.slice(0, 20)}...
              </div>
              {batchTxHash && batchTxHash !== batchId && (
                <div className="text-xs text-gray-600 dark:text-white/60 mt-1">
                  Tx Hash: {batchTxHash.slice(0, 20)}...
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Ready to Submit
            </h3>
            <p className="text-sm text-gray-600 dark:text-white/60">
              {validOrdersCount} of {limitOrders.length} orders are valid
            </p>
          </div>
          
          <motion.button
            onClick={handleBatchSubmit}
            disabled={loading || validOrdersCount === 0}
            whileHover={!loading && validOrdersCount > 0 ? { scale: 1.02 } : {}}
            whileTap={!loading && validOrdersCount > 0 ? { scale: 0.98 } : {}}
            className="liquid-glass-button px-8 py-4 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating Batch...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <ClockIcon className="w-5 h-5" />
                Create {validOrdersCount} Limit Order{validOrdersCount !== 1 ? 's' : ''} in Batch
              </div>
            )}
          </motion.button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {batchSuccess && (
          <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
            <p className="text-green-400 text-sm">
              🎉 Batch limit orders created successfully! All {validOrdersCount} orders have been submitted.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default BatchLimitOrderInterface;
