import { useState, useCallback } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { sendCalls, signTypedData } from '@wagmi/core';
import { config } from '@/lib/wagmi';
import { base } from 'wagmi/chains';
import { batchLimitOrderService } from '@/lib/batch-limit-order-service';

const CHAIN_ID = 8453;

export interface BatchLimitOrderParams {
  orders: {
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
    amountOut: string;
    decimalsIn: number;
    decimalsOut?: number;
  }[];
}

export interface UseBatchLimitOrderReturn {
  executeBatchLimitOrder: (params: BatchLimitOrderParams) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  txHash: string | null;
  isSuccess: boolean;
}

export function useBatchLimitOrder(): UseBatchLimitOrderReturn {
  const { address, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const executeBatchLimitOrder = useCallback(async (params: BatchLimitOrderParams) => {
    if (!address || !isConnected) {
      setError('Wallet not connected');
      return;
    }

    if (chainId !== CHAIN_ID) {
      try {
        await switchChain({ chainId: base.id });
      } catch (err) {
        setError('Please switch to Base network');
        return;
      }
    }

    setIsLoading(true);
    setError(null);
    setTxHash(null);
    setIsSuccess(false);

    try {
      console.log(`Creating batch limit orders for ${params.orders.length} orders`);

      // Step 1: Prepare batch approve calls for all tokens
      const { calls } = await batchLimitOrderService.prepareBatchLimitOrderCalls({
        orders: params.orders.map(order => ({
          ...order,
          maker: address,
        })),
        walletAddress: address,
      });

      // Step 2: Execute ALL approvals in ONE transaction using sendCalls
      if (calls.length > 0) {
        console.log(`Executing ${calls.length} approve calls in ONE transaction via sendCalls`);
        const result = await sendCalls(config, {
          calls,
          account: address,
        });
        setTxHash(result.id);
        console.log('Batch approval transaction ID:', result.id);
      }

      // Step 3: Create limit orders after approvals are done
      const orderResults = [];
      for (const orderParams of params.orders) {
        try {
          const { order, orderHash } = await batchLimitOrderService.createLimitOrder({
            ...orderParams,
            maker: address,
          });

          // Sign the order
          const typedData = order.getTypedData(CHAIN_ID);
          const signature = await signTypedData(config, {
            account: address,
            types: typedData.types,
            primaryType: typedData.primaryType,
            domain: typedData.domain,
            message: typedData.message,
          });

          // Submit to 1inch API
          await batchLimitOrderService.submitLimitOrder(order, signature);
          
          orderResults.push({ orderHash, order });
          console.log(`Created limit order: ${orderHash}`);
        } catch (err) {
          console.error('Failed to create individual limit order:', err);
          throw new Error(`Failed to create limit order: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      setIsSuccess(true);
      console.log(`Successfully created ${orderResults.length} limit orders with batch approvals`);
      console.log('Order hashes:', orderResults.map(r => r.orderHash));

    } catch (err) {
      console.error('Batch limit order error:', err);
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      
      // Handle user rejections with a friendly message
      if (message.includes('Transaction was rejected by user') ||
          message.includes('User denied') ||
          message.includes('User rejected') ||
          message.toLowerCase().includes('user denied transaction signature')) {
        setError('Transaction was cancelled by user');
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [address, isConnected, chainId, switchChain]);

  return {
    executeBatchLimitOrder,
    isLoading,
    error,
    txHash,
    isSuccess,
  };
}
