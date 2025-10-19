'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PlusIcon,
    ArrowsUpDownIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ClockIcon,
    TrashIcon
} from '@heroicons/react/24/outline';
import { useLimitOrder } from '@/hooks/useLimitOrder';
import { BASE_TOKENS } from '@/lib/wagmi';

interface OrderItem {
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
    targetPrice: string;
    inTokenDecimals: number;
    outTokenDecimals: number;
    expiration: string;
    partialFillEnabled: boolean;
}

const LimitOrdersPanel: React.FC = () => {
    const [orders, setOrders] = useState<OrderItem[]>([
        {
            tokenIn: BASE_TOKENS[0].address,
            tokenOut: BASE_TOKENS[1].address,
            amountIn: '',
            targetPrice: '',
            inTokenDecimals: BASE_TOKENS[0].decimals,
            outTokenDecimals: BASE_TOKENS[1].decimals,
            expiration: '1 Day',
            partialFillEnabled: true
        }
    ]);
    const [currentOrderIndex, setCurrentOrderIndex] = useState(0);
    const [justSubmitted, setJustSubmitted] = useState(false);
    const { createLimitOrder, loading, error, transactions, currentTx } = useLimitOrder();

    // Auto-reset on success
    useEffect(() => {
        if (justSubmitted && !error && !loading && transactions === 0) {
            const timer = setTimeout(() => {
                setOrders([{
                    tokenIn: BASE_TOKENS[0].address,
                    tokenOut: BASE_TOKENS[1].address,
                    amountIn: '',
                    targetPrice: '',
                    inTokenDecimals: BASE_TOKENS[0].decimals,
                    outTokenDecimals: BASE_TOKENS[1].decimals,
                    expiration: '1 Day',
                    partialFillEnabled: true
                }]);
                setCurrentOrderIndex(0);
                setJustSubmitted(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [justSubmitted, error, loading, transactions]);

    // Auto-clear errors
    useEffect(() => {
        if (error) {
            const isCancellation = error.includes('cancelled') || error.includes('canceled');
            const clearTime = isCancellation ? 8000 : 5000;

            const timer = setTimeout(() => {
                // Reset error by triggering state update
                setJustSubmitted(false);
            }, clearTime);
            return () => clearTimeout(timer);
        }
    }, [error]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) {
                return;
            }

            if (e.key === 'ArrowLeft' && currentOrderIndex > 0) {
                setCurrentOrderIndex(prev => prev - 1);
            } else if (e.key === 'ArrowRight' && currentOrderIndex < orders.length - 1) {
                setCurrentOrderIndex(prev => prev + 1);
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [orders.length, currentOrderIndex]);

    const addLimitOrder = useCallback(() => {
        setOrders(prev => {
            const newOrder: OrderItem = {
                tokenIn: BASE_TOKENS[0].address,
                tokenOut: BASE_TOKENS[1].address,
                amountIn: '',
                targetPrice: '',
                inTokenDecimals: BASE_TOKENS[0].decimals,
                outTokenDecimals: BASE_TOKENS[1].decimals,
                expiration: '1 Day',
                partialFillEnabled: true
            };
            const newOrders = [...prev, newOrder];
            setCurrentOrderIndex(newOrders.length - 1);
            return newOrders;
        });
    }, []);

    const removeLimitOrder = useCallback((index: number) => {
        if (orders.length <= 1) return;

        setOrders(prev => {
            const newOrders = prev.filter((_, i) => i !== index);
            if (currentOrderIndex >= newOrders.length) {
                setCurrentOrderIndex(newOrders.length - 1);
            } else if (currentOrderIndex > index) {
                setCurrentOrderIndex(prev => prev - 1);
            }
            return newOrders;
        });
    }, [orders.length, currentOrderIndex]);

    const updateLimitOrder = useCallback((index: number, updates: Partial<OrderItem>) => {
        setOrders(prev => prev.map((order, i) =>
            i === index ? { ...order, ...updates } : order
        ));
    }, []);

    const swapTokens = useCallback((index: number) => {
        setOrders(prev => prev.map((order, i) =>
            i === index ? {
                ...order,
                tokenIn: order.tokenOut,
                tokenOut: order.tokenIn,
                inTokenDecimals: order.outTokenDecimals,
                outTokenDecimals: order.inTokenDecimals,
                targetPrice: order.targetPrice ? (1 / parseFloat(order.targetPrice)).toFixed(6) : ''
            } : order
        ));
    }, []);

    // Input validation for number inputs
    const handleNumberKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Allow: backspace, delete, tab, escape, enter, decimal point, and numbers
        if (
            [46, 8, 9, 27, 13, 110, 190].indexOf(e.keyCode) !== -1 ||
            // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z
            (e.ctrlKey === true && [65, 67, 86, 88, 90].indexOf(e.keyCode) !== -1) ||
            // Allow: home, end, left, right
            (e.keyCode >= 35 && e.keyCode <= 39) ||
            // Allow numbers 0-9
            (e.keyCode >= 48 && e.keyCode <= 57) ||
            // Allow numpad numbers
            (e.keyCode >= 96 && e.keyCode <= 105)
        ) {
            return;
        }
        // Prevent input
        e.preventDefault();
    };

    const calculateEstimatedReceive = (order: OrderItem) => {
        try {
            if (!order.amountIn || !order.targetPrice) return '0.00';
            const amountIn = parseFloat(order.amountIn);
            const targetPrice = parseFloat(order.targetPrice);
            if (isNaN(amountIn) || isNaN(targetPrice) || amountIn <= 0 || targetPrice <= 0) {
                return '0.00';
            }
            return (amountIn * targetPrice).toFixed(4);
        } catch (_error) {
            return 'Error';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const validOrders = orders.filter(order =>
            order.amountIn &&
            order.targetPrice &&
            parseFloat(order.amountIn) > 0 &&
            parseFloat(order.targetPrice) > 0
        );

        if (validOrders.length === 0) return;

        // Calculate amountOut from targetPrice
        const ordersForSubmission = validOrders.map(order => ({
            tokenIn: order.tokenIn,
            tokenOut: order.tokenOut,
            amountIn: order.amountIn,
            amountOut: (parseFloat(order.amountIn) * parseFloat(order.targetPrice)).toString(),
            decimalsIn: order.inTokenDecimals,
            decimalsOut: order.outTokenDecimals
        }));

        await createLimitOrder(ordersForSubmission);

        // Mark as submitted for auto-reset
        setJustSubmitted(true);
    };

    const currentOrder = orders.length > 0 ? orders[currentOrderIndex] : null;
    const validOrdersCount = orders.filter(order =>
        order.amountIn &&
        order.targetPrice &&
        parseFloat(order.amountIn) > 0 &&
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
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Orders ({orders.length})</h3>
                            <button
                                onClick={addLimitOrder}
                                className="liquid-glass-button p-2 rounded-xl"
                                title="Add Order"
                            >
                                <PlusIcon className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {orders.map((order, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`liquid-glass rounded-xl p-3 cursor-pointer transition-all duration-200 ${index === currentOrderIndex
                                        ? 'ring-2 ring-blue-400 bg-blue-500/10'
                                        : 'hover:bg-white/10'
                                        }`}
                                    onClick={() => setCurrentOrderIndex(index)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                    {BASE_TOKENS.find(t => t.address === order.tokenIn)?.symbol} → {BASE_TOKENS.find(t => t.address === order.tokenOut)?.symbol}
                                                </span>
                                                {orders.length > 1 && (
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
                                                {order.amountIn || '0'} {BASE_TOKENS.find(t => t.address === order.tokenIn)?.symbol}
                                            </div>
                                            {order.targetPrice && (
                                                <div className="text-xs text-green-400">
                                                    @ {order.targetPrice} {BASE_TOKENS.find(t => t.address === order.tokenOut)?.symbol}/{BASE_TOKENS.find(t => t.address === order.tokenIn)?.symbol}
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <div className={`w-2 h-2 rounded-full ${order.amountIn && order.targetPrice &&
                                                parseFloat(order.amountIn) > 0 && parseFloat(order.targetPrice) > 0
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
                    {orders.length > 0 && currentOrder ? (
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
                                            {currentOrderIndex + 1} / {orders.length}
                                        </span>
                                        <button
                                            onClick={() => setCurrentOrderIndex(prev => Math.min(orders.length - 1, prev + 1))}
                                            disabled={currentOrderIndex === orders.length - 1}
                                            className="liquid-glass p-2 rounded-lg disabled:opacity-50"
                                        >
                                            <ChevronRightIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* From Token */}
                                <div className="space-y-4 mb-4">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-white/80">
                                        You&apos;re selling
                                    </label>
                                    <div className="liquid-glass rounded-2xl p-4">
                                        <div className="flex items-center justify-between">
                                            <select
                                                value={currentOrder.tokenIn}
                                                onChange={(e) => {
                                                    const token = BASE_TOKENS.find(t => t.address === e.target.value);
                                                    if (token) {
                                                        updateLimitOrder(currentOrderIndex, {
                                                            tokenIn: token.address,
                                                            inTokenDecimals: token.decimals
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
                                                value={currentOrder.amountIn}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    // Prevent negative values
                                                    if (value === '' || parseFloat(value) >= 0) {
                                                        updateLimitOrder(currentOrderIndex, {
                                                            amountIn: value
                                                        });
                                                    }
                                                }}
                                                onKeyDown={handleNumberKeyDown}
                                                className="bg-transparent text-right text-2xl font-bold border-0 focus:ring-0 w-full max-w-[150px]"
                                                min="0"
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
                                        You&apos;ll receive (minimum)
                                    </label>
                                    <div className="liquid-glass rounded-2xl p-4">
                                        <div className="flex items-center justify-between">
                                            <select
                                                value={currentOrder.tokenOut}
                                                onChange={(e) => {
                                                    const token = BASE_TOKENS.find(t => t.address === e.target.value);
                                                    if (token) {
                                                        updateLimitOrder(currentOrderIndex, {
                                                            tokenOut: token.address,
                                                            outTokenDecimals: token.decimals
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
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    // Prevent negative values
                                                    if (value === '' || parseFloat(value) >= 0) {
                                                        updateLimitOrder(currentOrderIndex, { targetPrice: value });
                                                    }
                                                }}
                                                onKeyDown={handleNumberKeyDown}
                                                className="bg-transparent text-lg font-bold border-0 focus:ring-0 flex-1"
                                                min="0"
                                            />
                                            <span className="text-sm text-gray-600 dark:text-white/60">
                                                {BASE_TOKENS.find(t => t.address === currentOrder.tokenOut)?.symbol}/{BASE_TOKENS.find(t => t.address === currentOrder.tokenIn)?.symbol}
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
                    ) : (
                        <div className="liquid-glass-card flex items-center justify-center h-96">
                            <div className="text-center">
                                <ClockIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-600 dark:text-white/60 mb-2">
                                    No Orders Yet
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-white/40">
                                    Click the + button to add your first limit order
                                </p>
                            </div>
                        </div>
                    )}
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
                                Creating individual limit orders for each valid order
                            </div>
                        </div>
                    </div>
                </div>

                {/* Transaction Status */}
                {transactions > 0 && (
                    <div className="mb-4 liquid-glass rounded-xl p-3">
                        <div className="text-sm">
                            <div className="font-medium text-gray-900 dark:text-white mb-1">
                                Processing Orders...
                            </div>
                            <div className="text-xs text-gray-600 dark:text-white/60">
                                Step {currentTx} of {transactions}
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            Ready to Submit
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-white/60">
                            {validOrdersCount} of {orders.length} orders are valid
                        </p>
                    </div>

                    <motion.button
                        onClick={handleSubmit}
                        disabled={loading || validOrdersCount === 0}
                        whileHover={!loading && validOrdersCount > 0 ? { scale: 1.02 } : {}}
                        whileTap={!loading && validOrdersCount > 0 ? { scale: 0.98 } : {}}
                        className="liquid-glass-button px-8 py-4 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Creating Orders...
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <ClockIcon className="w-5 h-5" />
                                Create {validOrdersCount} Limit Order{validOrdersCount !== 1 ? 's' : ''}
                            </div>
                        )}
                    </motion.button>
                </div>

                {error && (
                    <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                )}

                {!error && !loading && transactions === 0 && validOrdersCount > 0 && (
                    <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                        <p className="text-green-400 text-sm">
                            🎉 Limit orders created successfully!
                        </p>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default LimitOrdersPanel;
