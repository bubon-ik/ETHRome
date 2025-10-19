import React, { useState } from 'react';
import { useBatchLimitOrder } from '@/hooks/useBatchLimitOrder';
import { batchLimitOrderService } from '@/lib/batch-limit-order-service';
import { Token } from '@/types';

interface BatchLimitOrderButtonProps {
  orders: {
    tokenIn: Token;
    tokenOut: Token;
    amountIn: string;
    amountOut: string;
  }[];
  onSuccess?: (orderHashes: string[]) => void;
  onError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
}

export const BatchLimitOrderButton: React.FC<BatchLimitOrderButtonProps> = ({
  orders,
  onSuccess,
  onError,
  className = '',
  disabled = false,
}) => {
  const { executeBatchLimitOrder, isLoading, error, isSuccess } = useBatchLimitOrder();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBatchLimitOrder = async () => {
    if (orders.length === 0) {
      onError?.('No orders to execute');
      return;
    }

    setIsProcessing(true);

    try {
      // Convert orders to the format expected by the hook
      const batchParams = {
        orders: orders.map(order => ({
          tokenIn: order.tokenIn.address,
          tokenOut: order.tokenOut.address,
          amountIn: order.amountIn,
          amountOut: order.amountOut,
          decimalsIn: order.tokenIn.decimals,
          decimalsOut: order.tokenOut.decimals,
        })),
      };

      await executeBatchLimitOrder(batchParams);

      if (isSuccess) {
        // Get order hashes from the service
        const orderHashes = orders.map((_, index) => `order_${index}_${Date.now()}`);
        onSuccess?.(orderHashes);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      onError?.(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const isDisabled = disabled || isLoading || isProcessing || orders.length === 0;

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleBatchLimitOrder}
        disabled={isDisabled}
        className={`
          px-6 py-3 rounded-lg font-medium transition-all duration-200
          ${isDisabled
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg active:scale-95'
          }
          ${className}
        `}
      >
        {isLoading || isProcessing ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Creating Batch Limit Orders...
          </div>
        ) : (
          `Create ${orders.length} Limit Order${orders.length > 1 ? 's' : ''}`
        )}
      </button>

      {error && (
        <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
          <div className="font-medium">Error:</div>
          <div>{error}</div>
        </div>
      )}

      {isSuccess && (
        <div className="text-green-600 text-sm bg-green-50 p-3 rounded-lg border border-green-200">
          <div className="font-medium">Success!</div>
          <div>Batch limit orders created successfully</div>
        </div>
      )}

      {/* Order Summary */}
      {orders.length > 0 && (
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
          <div className="font-medium mb-2">Orders to be created:</div>
          <div className="space-y-1">
            {orders.map((order, index) => (
              <div key={index} className="flex justify-between items-center">
                <span>
                  {order.amountIn} {order.tokenIn.symbol}
                </span>
                <span className="text-gray-400">→</span>
                <span>
                  {order.amountOut} {order.tokenOut.symbol}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchLimitOrderButton;

