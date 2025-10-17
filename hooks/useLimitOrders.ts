import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { LimitOrder } from '@/types';
import { oneInchLimitOrderService } from '@/lib/1inch-limit-order';

export interface UseLimitOrdersReturn {
  orders: LimitOrder[];
  isLoading: boolean;
  error: string | null;
  createOrder: (params: CreateOrderParams) => Promise<void>;
  cancelOrder: (orderHash: string) => Promise<void>;
  refreshOrders: () => Promise<void>;
}

export interface CreateOrderParams {
  makerAsset: string;
  takerAsset: string;
  makerAmount: string;
  takerAmount: string;
  receiver?: string;
}

export function useLimitOrders(): UseLimitOrdersReturn {
  const { address } = useAccount();
  const [orders, setOrders] = useState<LimitOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!address) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await oneInchLimitOrderService.getLimitOrders(address);
      
      // Transform 1inch orders to our LimitOrder format
      const transformedOrders: LimitOrder[] = response.orders?.map((order: any) => ({
        id: order.orderHash,
        maker: order.maker,
        token: {
          address: order.makerAsset,
          symbol: order.makerAssetSymbol || 'UNKNOWN',
          name: order.makerAssetName || 'Unknown Token',
          decimals: order.makerAssetDecimals || 18,
          chainId: 8453,
        },
        amount: order.makerAmount,
        targetToken: {
          address: order.takerAsset,
          symbol: order.takerAssetSymbol || 'UNKNOWN',
          name: order.takerAssetName || 'Unknown Token',
          decimals: order.takerAssetDecimals || 18,
          chainId: 8453,
        },
        targetAmount: order.takerAmount,
        deadline: order.deadline || Date.now() + 86400000, // 24 hours default
        status: order.status || 'pending',
        createdAt: order.createDateTime || Date.now(),
      })) || [];

      setOrders(transformedOrders);
    } catch (err) {
      console.error('Failed to fetch limit orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  const createOrder = useCallback(async (params: CreateOrderParams) => {
    if (!address) {
      setError('Wallet not connected');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await oneInchLimitOrderService.createLimitOrder({
        ...params,
        maker: address,
      });

      // Refresh orders after creating
      await fetchOrders();
    } catch (err) {
      console.error('Failed to create limit order:', err);
      setError(err instanceof Error ? err.message : 'Failed to create order');
    } finally {
      setIsLoading(false);
    }
  }, [address, fetchOrders]);

  const cancelOrder = useCallback(async (orderHash: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await oneInchLimitOrderService.cancelLimitOrder(orderHash);
      
      // Remove order from local state
      setOrders(prev => prev.filter(order => order.id !== orderHash));
    } catch (err) {
      console.error('Failed to cancel limit order:', err);
      setError(err instanceof Error ? err.message : 'Failed to cancel order');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshOrders = useCallback(async () => {
    await fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (address) {
      fetchOrders();
    }
  }, [address, fetchOrders]);

  return {
    orders,
    isLoading,
    error,
    createOrder,
    cancelOrder,
    refreshOrders,
  };
}


