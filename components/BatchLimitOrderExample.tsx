import React, { useState } from 'react';
import { useBatchLimitOrder } from '@/hooks/useBatchLimitOrder';
import { BASE_TOKENS } from '@/lib/wagmi';

const BatchLimitOrderExample: React.FC = () => {
  const { executeBatchLimitOrder, isLoading, error, txHash, isSuccess } = useBatchLimitOrder();
  const [orders, setOrders] = useState([
    {
      tokenIn: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
      tokenOut: '0x0000000000000000000000000000000000000000', // ETH
      amountIn: '100',
      amountOut: '0.033',
      decimalsIn: 6,
      decimalsOut: 18,
    },
    {
      tokenIn: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
      tokenOut: '0x4200000000000000000000000000000000000006', // WETH
      amountIn: '200',
      amountOut: '0.066',
      decimalsIn: 6,
      decimalsOut: 18,
    },
  ]);

  const handleCreateBatchOrders = async () => {
    console.log('Creating batch limit orders:', orders);
    await executeBatchLimitOrder({ orders });
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Batch Limit Orders Example</h2>
      
      <div className="space-y-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Orders to Create:</h3>
        {orders.map((order, index) => {
          const inToken = BASE_TOKENS.find(t => t.address === order.tokenIn);
          const outToken = BASE_TOKENS.find(t => t.address === order.tokenOut);
          return (
            <div key={index} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-medium">{order.amountIn} {inToken?.symbol}</span>
                  <span className="text-gray-500 mx-2">→</span>
                  <span className="font-medium">{order.amountOut} {outToken?.symbol}</span>
                </div>
                <div className="text-sm text-gray-500">
                  Order #{index + 1}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={handleCreateBatchOrders}
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Creating Batch Limit Orders...
          </div>
        ) : (
          `Create ${orders.length} Limit Orders with Batch Approvals`
        )}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-800 font-medium">Error:</div>
          <div className="text-red-700 text-sm mt-1">{error}</div>
        </div>
      )}

      {txHash && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-blue-800 font-medium">Batch Approval Transaction:</div>
          <div className="text-blue-700 text-sm mt-1 font-mono break-all">{txHash}</div>
        </div>
      )}

      {isSuccess && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-green-800 font-medium">Success!</div>
          <div className="text-green-700 text-sm mt-1">
            All {orders.length} limit orders created successfully with batch approvals!
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="text-yellow-800 font-medium">How it works:</div>
        <div className="text-yellow-700 text-sm mt-1">
          <ol className="list-decimal list-inside space-y-1">
            <li>Checks allowances for all tokens needed</li>
            <li>Creates batch approve calls for insufficient allowances</li>
            <li>Executes ALL approvals in ONE transaction using wagmi sendCalls</li>
            <li>Creates individual limit orders through 1inch API</li>
            <li>Signs and submits each order to 1inch orderbook</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default BatchLimitOrderExample;

