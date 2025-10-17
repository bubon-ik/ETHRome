import React, { useState, useCallback } from 'react';
import { PlusIcon, ArrowsUpDownIcon, Cog6ToothIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import TokenSelector from './TokenSelector';
import AmountInput from './AmountInput';
import SwapRoute from './SwapRoute';
import BatchSwapButton from './BatchSwapButton';
import { SwapRoute as SwapRouteType, Token } from '@/types';
import { BASE_TOKENS } from '@/lib/wagmi';
import { oneInchLimitOrderService } from '@/lib/1inch-limit-order';

const SwapInterface: React.FC = () => {
  const [routes, setRoutes] = useState<SwapRouteType[]>([
    {
      from: { ...BASE_TOKENS[0], amount: '' },
      to: { ...BASE_TOKENS[1], amount: '' },
    }
  ]);
  const [currentRouteIndex, setCurrentRouteIndex] = useState(0);
  const [slippage, setSlippage] = useState(1);
  const [deadline, setDeadline] = useState(20);
  const [showSettings, setShowSettings] = useState(false);
  const features = oneInchLimitOrderService.getFeatures();

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return; // Don't interfere with input fields
      
      if (e.key === 'ArrowLeft') {
        setCurrentRouteIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentRouteIndex(prev => Math.min(routes.length - 1, prev + 1));
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [routes.length]);

  const addRoute = useCallback(() => {
    setRoutes(prev => {
      const newRoutes = [...prev, {
        from: { ...BASE_TOKENS[0], amount: '' },
        to: { ...BASE_TOKENS[1], amount: '' },
      }];
      // Automatically navigate to the new route
      setCurrentRouteIndex(newRoutes.length - 1);
      return newRoutes;
    });
  }, []);

  const removeRoute = useCallback((index: number) => {
    if (routes.length > 1) {
      setRoutes(prev => prev.filter((_, i) => i !== index));
      // Adjust current index if needed
      if (currentRouteIndex >= index && currentRouteIndex > 0) {
        setCurrentRouteIndex(currentRouteIndex - 1);
      } else if (currentRouteIndex >= routes.length - 1) {
        setCurrentRouteIndex(Math.max(0, routes.length - 2));
      }
    }
  }, [routes.length, currentRouteIndex]);

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
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">Multi-Token Swap</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 transition-colors duration-300">Execute multiple token swaps in one transaction</p>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200"
          >
            <Cog6ToothIcon className="w-6 h-6" />
          </button>
        </div>

                {/* API Status Info */}
                {features.demoMode && (
                  <div className="mb-6 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4 transition-colors duration-300">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-yellow-400 dark:bg-yellow-500 rounded-full animate-pulse"></div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 transition-colors duration-300">Demo Mode Active</h3>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1 transition-colors duration-300">
                          Using mock data for demonstration. Get a
                          <a
                            href="https://portal.1inch.dev/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mx-1 underline hover:no-underline font-medium text-yellow-800 dark:text-yellow-200 hover:text-yellow-600 dark:hover:text-yellow-100 transition-colors duration-200"
                          >
                            1inch API key
                          </a>
                          for real swaps and limit orders.
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
              className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl transition-colors duration-300"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 transition-colors duration-300">
                    Slippage Tolerance
                  </label>
                  <div className="flex gap-2">
                    {[0.5, 1, 3].map(value => (
                      <button
                        key={value}
                        onClick={() => setSlippage(value)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          slippage === value
                            ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-md'
                            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                        }`}
                      >
                        {value}%
                      </button>
                    ))}
                    <input
                      type="number"
                      value={slippage}
                      onChange={(e) => setSlippage(Number(e.target.value))}
                      className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-300"
                      step="0.1"
                      min="0.1"
                      max="50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 transition-colors duration-300">
                    Transaction Deadline
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={deadline}
                      onChange={(e) => setDeadline(Number(e.target.value))}
                      className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-300"
                      min="1"
                      max="4320"
                    />
                    <span className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">minutes</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Swap Routes Carousel */}
        <div className="mb-6">
          {/* Route Navigation Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 transition-colors duration-300">
                Swap Routes
              </h3>
              <div className="flex items-center gap-1">
                {routes.map((_, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setCurrentRouteIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      currentRouteIndex === index 
                        ? 'bg-primary-500 w-6' 
                        : 'bg-gray-300 dark:bg-gray-600 hover:bg-primary-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">
                {currentRouteIndex + 1} of {routes.length}
              </span>
            </div>
            
            {/* Navigation Arrows */}
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentRouteIndex(Math.max(0, currentRouteIndex - 1))}
                disabled={currentRouteIndex === 0}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  currentRouteIndex === 0
                    ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentRouteIndex(Math.min(routes.length - 1, currentRouteIndex + 1))}
                disabled={currentRouteIndex === routes.length - 1}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  currentRouteIndex === routes.length - 1
                    ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <ChevronRightIcon className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          {/* Cards Container */}
          <motion.div 
            className="relative overflow-hidden rounded-2xl"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, { offset, velocity }) => {
              const swipe = Math.abs(offset.x) * velocity.x;
              
              if (swipe < -10000) {
                // Swipe left (next route)
                setCurrentRouteIndex(prev => Math.min(routes.length - 1, prev + 1));
              } else if (swipe > 10000) {
                // Swipe right (previous route)
                setCurrentRouteIndex(prev => Math.max(0, prev - 1));
              }
            }}
          >
            <motion.div 
              className="flex"
              animate={{ x: -currentRouteIndex * 100 + '%' }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {routes.map((route, index) => (
                <div key={index} className="w-full flex-shrink-0">
                  <motion.div
                    initial={false}
                    animate={{ 
                      scale: currentRouteIndex === index ? 1 : 0.95,
                      opacity: currentRouteIndex === index ? 1 : 0.7 
                    }}
                    transition={{ duration: 0.3 }}
                    className="mx-2"
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
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Add Route Button */}
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={addRoute}
            className="flex-1 flex items-center justify-center gap-3 py-4 px-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-400 hover:border-primary-400 dark:hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-300 group"
          >
            <motion.div
              whileHover={{ rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              <PlusIcon className="w-5 h-5" />
            </motion.div>
            <span className="font-medium">Add Another Swap Route</span>
            <motion.div
              initial={{ x: 0 }}
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            >
              →
            </motion.div>
          </motion.button>
          
          {routes.length > 1 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-r from-primary-500 to-purple-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg"
            >
              {routes.length} Routes
            </motion.div>
          )}
        </div>

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
