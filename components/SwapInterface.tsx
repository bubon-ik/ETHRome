import React, { useState, useCallback } from 'react';
import { PlusIcon, ArrowsUpDownIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import TokenSelector from './TokenSelector';
import AmountInput from './AmountInput';
import SwapRoute from './SwapRoute';
import BatchSwapButton from './BatchSwapButton';
import { SwapRoute as SwapRouteType, Token } from '@/types';
import { BASE_TOKENS } from '@/lib/wagmi';
import { oneInchService } from '@/lib/1inch';

const SwapInterface: React.FC = () => {
  const [routes, setRoutes] = useState<SwapRouteType[]>([
    {
      from: { ...BASE_TOKENS[0], amount: '' },
      to: { ...BASE_TOKENS[1], amount: '' },
    }
  ]);
  const [slippage, setSlippage] = useState(1);
  const [deadline, setDeadline] = useState(20);
  const [showSettings, setShowSettings] = useState(false);
  const features = oneInchService.getFeatures();

  const addRoute = useCallback(() => {
    setRoutes(prev => [...prev, {
      from: { ...BASE_TOKENS[0], amount: '' },
      to: { ...BASE_TOKENS[1], amount: '' },
    }]);
  }, []);

  const removeRoute = useCallback((index: number) => {
    if (routes.length > 1) {
      setRoutes(prev => prev.filter((_, i) => i !== index));
    }
  }, [routes.length]);

  const updateRoute = useCallback((index: number, updatedRoute: SwapRouteType) => {
    setRoutes(prev => prev.map((route, i) => i === index ? updatedRoute : route));
  }, []);

  const swapTokens = useCallback((index: number) => {
    setRoutes(prev => prev.map((route, i) => {
      if (i === index) {
        return {
          ...route,
          from: { ...route.to, amount: route.from.amount },
          to: { ...route.from, amount: route.to.amount },
        };
      }
      return route;
    }));
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="card">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Multi-Token Swap</h1>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <Cog6ToothIcon className="w-6 h-6" />
          </button>
        </div>

        {/* API Status Info */}
        {!features.limitOrders && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-800">Running without API key</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Batch swaps work perfectly! Get a 
                  <a 
                    href="https://portal.1inch.dev/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mx-1 underline hover:no-underline font-medium"
                  >
                    1inch API key
                  </a>
                  to unlock limit orders.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 bg-gray-50 rounded-xl"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Slippage Tolerance
                  </label>
                  <div className="flex gap-2">
                    {[0.5, 1, 3].map(value => (
                      <button
                        key={value}
                        onClick={() => setSlippage(value)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          slippage === value
                            ? 'bg-primary-600 text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {value}%
                      </button>
                    ))}
                    <input
                      type="number"
                      value={slippage}
                      onChange={(e) => setSlippage(Number(e.target.value))}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      step="0.1"
                      min="0.1"
                      max="50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transaction Deadline
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={deadline}
                      onChange={(e) => setDeadline(Number(e.target.value))}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      min="1"
                      max="4320"
                    />
                    <span className="text-sm text-gray-500">minutes</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Swap Routes */}
        <div className="space-y-4 mb-6">
          {routes.map((route, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="relative"
            >
              <SwapRoute
                route={route}
                index={index}
                onUpdate={(updatedRoute) => updateRoute(index, updatedRoute)}
                onRemove={() => removeRoute(index)}
                onSwap={() => swapTokens(index)}
                canRemove={routes.length > 1}
              />
            </motion.div>
          ))}
        </div>

        {/* Add Route Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={addRoute}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-primary-300 hover:text-primary-600 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Add Another Swap
        </motion.button>

        {/* Batch Swap Button */}
        <div className="mt-6">
          <BatchSwapButton
            routes={routes}
            slippage={slippage}
            deadline={deadline}
          />
        </div>
      </div>
    </div>
  );
};

export default SwapInterface;
