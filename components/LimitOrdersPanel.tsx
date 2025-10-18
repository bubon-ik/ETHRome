import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClockIcon, XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useAccount } from 'wagmi';
import { useLimitOrders } from '@/hooks/useLimitOrders';
import TokenSelector from './TokenSelector';
import AmountInput from './AmountInput';
import { BASE_TOKENS } from '@/lib/wagmi';
import { Token } from '@/types';
import { oneInchLimitOrderService } from '@/lib/1inch-limit-order';

const LimitOrdersPanel: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { orders, isLoading, error, createOrder, cancelOrder, refreshOrders } = useLimitOrders();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const features = oneInchLimitOrderService.getFeatures();
  const [newOrder, setNewOrder] = useState<{
    makerToken: Token;
    makerAmount: string;
    takerToken: Token;
    takerAmount: string;
  }>({
    makerToken: BASE_TOKENS[0],
    makerAmount: '',
    takerToken: BASE_TOKENS[1],
    takerAmount: '',
  });

  const handleCreateOrder = async () => {
    if (!newOrder.makerAmount || !newOrder.takerAmount) return;

    try {
      await createOrder({
        makerAsset: newOrder.makerToken.address,
        takerAsset: newOrder.takerToken.address,
        makerAmount: newOrder.makerAmount,
        takerAmount: newOrder.takerAmount,
      });

      // Reset form
      setNewOrder({
        makerToken: BASE_TOKENS[0],
        makerAmount: '',
        takerToken: BASE_TOKENS[1],
        takerAmount: '',
      });
      setShowCreateForm(false);
    } catch (err) {
      console.error('Failed to create order:', err);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-700';
      case 'filled': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700';
      case 'cancelled': return 'bg-gray-100 dark:bg-gray-700/50 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600';
      case 'expired': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700';
      default: return 'bg-gray-100 dark:bg-gray-700/50 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600';
    }
  };

  if (!isConnected) {
    return (
      <div className="card text-center py-12">
        <ClockIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4 transition-colors duration-300" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-300">Limit Orders</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6 transition-colors duration-300">Connect your wallet to create and manage limit orders</p>
      </div>
    );
  }

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-xl transition-colors duration-300">
            <ClockIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300">Limit Orders</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">Set price targets for automatic execution</p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCreateForm(!showCreateForm)}
          disabled={!features.limitOrders}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
            features.limitOrders 
              ? 'bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600 text-white shadow-md hover:shadow-lg' 
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          }`}
        >
          <PlusIcon className="w-5 h-5" />
          Create Order
        </motion.button>
      </div>

      {/* API Status */}
      {!features.limitOrders && (
        <div className="mb-6 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4 transition-colors duration-300">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-yellow-400 dark:bg-yellow-500 rounded-full animate-pulse"></div>
            <div>
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 transition-colors duration-300">Limit Orders Unavailable</h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1 transition-colors duration-300">
                Limit orders require a 1inch API key. 
                <a 
                  href="https://portal.1inch.dev/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="ml-1 underline hover:no-underline text-yellow-800 dark:text-yellow-200 hover:text-yellow-600 dark:hover:text-yellow-100 transition-colors duration-200"
                >
                  Get API key
                </a> or enjoy batch swaps without API key!
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2 transition-colors duration-300">
                Current features: Swaps ✅ | Quotes ✅ | Rate limit: {features.rateLimit}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Create Order Form */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-6 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 transition-colors duration-300"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-300">Create Limit Order</h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors duration-200"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Sell Token */}
              <div className="bg-white dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600 transition-colors duration-300">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 transition-colors duration-300">
                  Sell
                </label>
                <div className="flex items-center gap-3 mb-3">
                  <TokenSelector
                    selectedToken={newOrder.makerToken}
                    onSelect={(token) => setNewOrder(prev => ({ ...prev, makerToken: token }))}
                  />
                  <AmountInput
                    value={newOrder.makerAmount}
                    onChange={(amount) => setNewOrder(prev => ({ ...prev, makerAmount: amount }))}
                    placeholder="0.0"
                  />
                </div>
              </div>

              {/* Buy Token */}
              <div className="bg-white dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600 transition-colors duration-300">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 transition-colors duration-300">
                  Buy (minimum)
                </label>
                <div className="flex items-center gap-3 mb-3">
                  <TokenSelector
                    selectedToken={newOrder.takerToken}
                    onSelect={(token) => setNewOrder(prev => ({ ...prev, takerToken: token }))}
                  />
                  <AmountInput
                    value={newOrder.takerAmount}
                    onChange={(amount) => setNewOrder(prev => ({ ...prev, takerAmount: amount }))}
                    placeholder="0.0"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreateOrder}
                disabled={!newOrder.makerAmount || !newOrder.takerAmount || isLoading}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating...' : 'Create Limit Order'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowCreateForm(false)}
                className="btn-secondary"
              >
                Cancel
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-4 transition-colors duration-300">
          <p className="text-red-700 dark:text-red-300 text-sm transition-colors duration-300">{error}</p>
        </div>
      )}

      {/* Orders List */}
      <div className="space-y-4">
        {isLoading && orders.length === 0 ? (
          <div className="text-center py-8">
            <div className="inline-block w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-500 dark:text-gray-400 transition-colors duration-300">Loading your limit orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors duration-300">
              <ClockIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-300">No Limit Orders</h3>
            <p className="text-gray-500 dark:text-gray-400 transition-colors duration-300">Create your first limit order to start trading automatically</p>
          </div>
        ) : (
          orders.map((order) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg dark:hover:shadow-gray-900/20 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)} transition-colors duration-300`}>
                    {order.status}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
                    {formatDate(order.createdAt)}
                  </span>
                </div>
                {order.status === 'pending' && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => cancelOrder(order.id)}
                    className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </motion.button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 transition-colors duration-300">
                  <span className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wide">Sell</span>
                  <p className="font-semibold text-gray-900 dark:text-white mt-1 transition-colors duration-300">
                    {(parseFloat(order.amount) / Math.pow(10, order.token.decimals)).toFixed(4)} {order.token.symbol}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 transition-colors duration-300">
                  <span className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wide">For (min)</span>
                  <p className="font-semibold text-gray-900 dark:text-white mt-1 transition-colors duration-300">
                    {(parseFloat(order.targetAmount) / Math.pow(10, order.targetToken.decimals)).toFixed(4)} {order.targetToken.symbol}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 transition-colors duration-300">
                  <span className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wide">Rate</span>
                  <p className="font-semibold text-gray-900 dark:text-white mt-1 transition-colors duration-300">
                    {((parseFloat(order.targetAmount) / Math.pow(10, order.targetToken.decimals)) / 
                      (parseFloat(order.amount) / Math.pow(10, order.token.decimals))).toFixed(6)}
                  </p>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Refresh Button */}
      {orders.length > 0 && (
        <div className="mt-6 text-center">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={refreshOrders}
            disabled={isLoading}
            className="btn-secondary disabled:opacity-50"
          >
            {isLoading ? 'Refreshing...' : 'Refresh Orders'}
          </motion.button>
        </div>
      )}
    </div>
  );
};

export default LimitOrdersPanel;
