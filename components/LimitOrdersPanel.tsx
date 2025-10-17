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
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'filled': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isConnected) {
    return (
      <div className="card text-center py-12">
        <ClockIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Limit Orders</h3>
        <p className="text-gray-500 mb-6">Connect your wallet to create and manage limit orders</p>
      </div>
    );
  }

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ClockIcon className="w-6 h-6 text-primary-600" />
          <h2 className="text-xl font-bold text-gray-900">Limit Orders</h2>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCreateForm(!showCreateForm)}
          disabled={!features.limitOrders}
          className={`flex items-center gap-2 ${
            features.limitOrders 
              ? 'btn-primary' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed px-4 py-2 rounded-xl'
          }`}
        >
          <PlusIcon className="w-5 h-5" />
          Create Order
        </motion.button>
      </div>

      {/* API Status */}
      {!features.limitOrders && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <div>
              <h3 className="font-semibold text-yellow-800">Limit Orders Unavailable</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Limit orders require a 1inch API key. 
                <a 
                  href="https://portal.1inch.dev/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="ml-1 underline hover:no-underline"
                >
                  Get API key
                </a> or enjoy batch swaps without API key!
              </p>
              <p className="text-xs text-yellow-600 mt-2">
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
            className="mb-6 p-6 bg-gray-50 rounded-xl border border-gray-200"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Limit Order</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Sell Token */}
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-3">
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
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-3">
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
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Orders List */}
      <div className="space-y-4">
        {isLoading && orders.length === 0 ? (
          <div className="text-center py-8">
            <div className="inline-block w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-500">Loading your limit orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <ClockIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Limit Orders</h3>
            <p className="text-gray-500">Create your first limit order to start trading automatically</p>
          </div>
        ) : (
          orders.map((order) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-200 rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                  <span className="text-sm text-gray-500">
                    {formatDate(order.createdAt)}
                  </span>
                </div>
                {order.status === 'pending' && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => cancelOrder(order.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </motion.button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Sell</span>
                  <p className="font-semibold">
                    {(parseFloat(order.amount) / Math.pow(10, order.token.decimals)).toFixed(4)} {order.token.symbol}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">For (min)</span>
                  <p className="font-semibold">
                    {(parseFloat(order.targetAmount) / Math.pow(10, order.targetToken.decimals)).toFixed(4)} {order.targetToken.symbol}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Rate</span>
                  <p className="font-semibold">
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
