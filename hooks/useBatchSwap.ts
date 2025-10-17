import { useState, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { sendCalls } from '@wagmi/core';
import { config } from '@/lib/wagmi';
import { parseEther, parseUnits } from 'viem';
import { BatchSwapParams, SwapRoute } from '@/types';
import { oneInchService } from '@/lib/1inch';

export interface UseBatchSwapReturn {
  executeBatchSwap: (params: BatchSwapParams) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  txHash: string | null;
  isSuccess: boolean;
}

export function useBatchSwap(): UseBatchSwapReturn {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const { data: transactionReceipt } = useWaitForTransactionReceipt({
    hash: txHash as `0x${string}` | undefined,
  });

  const executeBatchSwap = useCallback(async (params: BatchSwapParams) => {
    if (!address) {
      setError('Wallet not connected');
      return;
    }

    setIsLoading(true);
    setError(null);
    setTxHash(null);
    setIsSuccess(false);

    try {
      const calls = [];

      // Prepare calls for each swap route
      for (const route of params.routes) {
        const { from, to } = route;
        
        // Get swap transaction data from 1inch
        const swapParams = {
          src: from.address,
          dst: to.address,
          amount: parseUnits(from.amount, from.decimals).toString(),
          from: address,
          slippage: params.slippage || 1,
          disableEstimate: true,
        };

            const swapData = await oneInchService.getSwapTransaction(swapParams);

        // Check if token needs approval (skip for ETH)
        if (from.address !== '0x0000000000000000000000000000000000000000') {
          // В SDK версии пока пропускаем approve для демо
          // В реальной версии здесь будет проверка allowance через SDK
          // Пока добавляем моковый approve call
          calls.push({
            to: from.address as `0x${string}`,
            data: '0x095ea7b30000000000000000000000001111111254eeb25477b68fb85ed929f73a9605820000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`,
            value: BigInt(0),
          });
        }

        // Add swap call
        calls.push({
          to: swapData.tx.to as `0x${string}`,
          data: swapData.tx.data as `0x${string}`,
          value: BigInt(swapData.tx.value || '0'),
        });
      }

      // Execute batch transaction using sendCalls
      const result = await sendCalls(config, {
        calls,
        account: address,
      });

      setTxHash(result.id);
      setIsSuccess(true);
    } catch (err) {
      console.error('Batch swap error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  return {
    executeBatchSwap,
    isLoading,
    error,
    txHash,
    isSuccess: isSuccess && !!transactionReceipt,
  };
}


