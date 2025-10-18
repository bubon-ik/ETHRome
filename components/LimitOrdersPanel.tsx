'use client';

import React, { useState } from 'react';
import { useLimitOrder } from '@/hooks/useLimitOrder';
import { BASE_TOKENS } from '@/lib/wagmi';

const LimitOrdersPanel: React.FC = () => {
    const [tokenIn, setTokenIn] = useState(BASE_TOKENS[0].address);
    const [tokenOut, setTokenOut] = useState(BASE_TOKENS[1].address);
    const [amountIn, setAmountIn] = useState('');
    const [amountOut, setAmountOut] = useState('');
    const { createLimitOrder, loading, error } = useLimitOrder();

    const inToken = BASE_TOKENS.find(t => t.address === tokenIn)!;
    const outToken = BASE_TOKENS.find(t => t.address === tokenOut)!;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amountIn || !amountOut) return;

        await createLimitOrder(
            tokenIn,
            tokenOut,
            amountIn,
            amountOut,
            inToken.decimals,
            outToken.decimals
        );
    };

    return (
        <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Limit Order</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
                    <select
                        value={tokenIn}
                        onChange={(e) => setTokenIn(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
                    <select
                        value={tokenOut}
                        onChange={(e) => setTokenOut(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading || !amountIn || !amountOut}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? 'Creating...' : 'Create Limit Order'}
                </button>

                {error && <p className="text-red-600 text-sm">{error}</p>}
            </form>
        </div>
    );
};

export default LimitOrdersPanel;
