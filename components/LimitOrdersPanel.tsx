'use client';

import React, { useState } from 'react';
import { useLimitOrder } from '@/hooks/useLimitOrder';
import { BASE_TOKENS } from '@/lib/wagmi';

interface OrderItem {
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
    amountOut: string;
    inTokenDecimals: number;
    outTokenDecimals: number;
}

const LimitOrdersPanel: React.FC = () => {
    // Start with WETH as default token in and USDC as token out
    const [tokenIn, setTokenIn] = useState(BASE_TOKENS[0].address); // Now WETH is the first token
    const [tokenOut, setTokenOut] = useState(BASE_TOKENS[1].address); // USDC is the second token
    const [amountIn, setAmountIn] = useState('');
    const [amountOut, setAmountOut] = useState('');
    const [orders, setOrders] = useState<OrderItem[]>([]);
    const { createLimitOrder, loading, error, transactions, currentTx } = useLimitOrder();

    const inToken = BASE_TOKENS.find(t => t.address === tokenIn)!;
    const outToken = BASE_TOKENS.find(t => t.address === tokenOut)!;

    const addToOrders = () => {
        if (!amountIn || !amountOut) return;

        const newOrder: OrderItem = {
            tokenIn,
            tokenOut,
            amountIn,
            amountOut,
            inTokenDecimals: inToken.decimals,
            outTokenDecimals: outToken.decimals
        };

        setOrders([...orders, newOrder]);
        setAmountIn('');
        setAmountOut('');
    };

    const removeOrder = (index: number) => {
        const updatedOrders = [...orders];
        updatedOrders.splice(index, 1);
        setOrders(updatedOrders);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (orders.length === 0) return;

        await createLimitOrder(
            orders.map(order => ({
                tokenIn: order.tokenIn,
                tokenOut: order.tokenOut,
                amountIn: order.amountIn,
                amountOut: order.amountOut,
                decimalsIn: order.inTokenDecimals,
                decimalsOut: order.outTokenDecimals
            }))
        );

        // Clear orders after successful submission
        if (!error) {
            setOrders([]);
        }
    };

    return (
        <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Batch Limit Orders</h3>

            <div className="space-y-4 mb-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
                    <select
                        value={tokenIn}
                        onChange={(e) => setTokenIn(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        disabled={loading}
                    >
                        {BASE_TOKENS.map(t => (
                            <option key={t.address} value={t.address}>{t.symbol}</option>
                        ))}
                    </select>
                    <input
                        type="number"
                        step="0.0001"
                        placeholder="Amount"
                        value={amountIn}
                        onChange={(e) => setAmountIn(e.target.value)}
                        className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg"
                        disabled={loading}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
                    <select
                        value={tokenOut}
                        onChange={(e) => setTokenOut(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        disabled={loading}
                    >
                        {BASE_TOKENS.map(t => (
                            <option key={t.address} value={t.address}>{t.symbol}</option>
                        ))}
                    </select>
                    <input
                        type="number"
                        step="0.0001"
                        placeholder="Min amount to receive"
                        value={amountOut}
                        onChange={(e) => setAmountOut(e.target.value)}
                        className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg"
                        disabled={loading}
                    />
                </div>

                <button
                    type="button"
                    onClick={addToOrders}
                    disabled={loading || !amountIn || !amountOut}
                    className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                    Add to Batch
                </button>
            </div>

            {orders.length > 0 && (
                <div className="mb-4">
                    <h4 className="text-md font-semibold text-gray-800 mb-2">Orders in Batch ({orders.length})</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                        {orders.map((order, index) => {
                            const inTokenSymbol = BASE_TOKENS.find(t => t.address === order.tokenIn)?.symbol;
                            const outTokenSymbol = BASE_TOKENS.find(t => t.address === order.tokenOut)?.symbol;
                            return (
                                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                    <div className="text-sm">
                                        {order.amountIn} {inTokenSymbol} → {order.amountOut} {outTokenSymbol}
                                    </div>
                                    <button
                                        onClick={() => removeOrder(index)}
                                        disabled={loading}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        ✖
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {transactions > 0 && (
                <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Transaction progress:</span>
                        <span>{currentTx} of {transactions}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(currentTx / transactions) * 100}%` }}
                        ></div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <button
                    type="submit"
                    disabled={loading || orders.length === 0}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? `Processing (${currentTx}/${transactions})...` : `Create ${orders.length} Limit Order${orders.length !== 1 ? 's' : ''}`}
                </button>
            </form>

            {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        </div>
    );
};

export default LimitOrdersPanel;
