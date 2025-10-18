/**
 * Hook для выполнения batch swap через 1inch Fusion SDK + wagmi sendCalls
 * 
 * Поддерживает два режима:
 * 1. Fusion Mode (Gasless) - создает Fusion orders для gasless свапов
 * 2. Standard Mode - использует sendCalls для batch свапов с обычным gas
 * 
 * @see https://wagmi.sh/core/api/actions/sendCalls
 * @see https://github.com/1inch/fusion-sdk
 */

import { useState, useCallback } from 'react';
import { useAccount, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { sendCalls, getCallsStatus } from '@wagmi/core';
import { config } from '@/lib/wagmi';
import { parseUnits, encodeFunctionData, erc20Abi, type Address } from 'viem';
import { BatchSwapParams, SwapRoute } from '@/types';
import { fusionService, type BatchSwapOrder } from '@/lib/1inch-fusion';
import { 
  prepareFusionOrderParams, 
  needsApproval, 
  getOneInchRouterAddress,
  createApproveCalldata,
  validateSwapParams,
  generateBatchId,
  isNativeToken
} from '@/lib/fusion-utils';

export type SwapMode = 'fusion' | 'standard';

export interface UseBatchSwapReturn {
  executeBatchSwap: (params: BatchSwapParams & { mode?: SwapMode }) => Promise<void>;
  executeFusionBatchSwap: (params: BatchSwapParams) => Promise<void>;
  executeStandardBatchSwap: (params: BatchSwapParams) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  txHash: string | null;
  batchId: string | null;
  fusionOrders: BatchSwapOrder[];
  isSuccess: boolean;
  mode: SwapMode;
}

export function useBatchSwap(): UseBatchSwapReturn {
  const { address, chain } = useAccount();
  const publicClient = usePublicClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [fusionOrders, setFusionOrders] = useState<BatchSwapOrder[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [mode, setMode] = useState<SwapMode>('fusion');

  const { data: transactionReceipt } = useWaitForTransactionReceipt({
    hash: txHash as `0x${string}` | undefined,
  });

  /**
   * Выполнить batch swap через Fusion SDK (Gasless)
   * Создает множество Fusion orders которые resolvers выполнят бесплатно
   */
  const executeFusionBatchSwap = useCallback(async (params: BatchSwapParams) => {
    if (!address) {
      setError('Wallet not connected');
      return;
    }

    setIsLoading(true);
    setError(null);
    setTxHash(null);
    setBatchId(null);
    setFusionOrders([]);
    setIsSuccess(false);
    setMode('fusion');

    try {
      console.log('🚀 Starting Fusion batch swap (Gasless mode)...');

      // Валидация всех routes
      for (const route of params.routes) {
        const validation = validateSwapParams(route);
        if (!validation.valid) {
          throw new Error(`Route validation failed: ${validation.error}`);
        }
      }

      // Создаем Fusion orders для каждого swap
      const orders = await fusionService.createBatchFusionOrders({
        routes: params.routes,
        walletAddress: address,
      });

      setFusionOrders(orders);
      
      // Генерируем batch ID для отслеживания
      const newBatchId = generateBatchId();
      setBatchId(newBatchId);

      console.log(`✅ Created ${orders.length} Fusion orders (gasless)`);
      console.log('Order hashes:', orders.map(o => o.order.orderHash));

      // Сохраняем первый order hash как txHash для совместимости
      if (orders.length > 0) {
        setTxHash(orders[0].order.orderHash);
      }

      setIsSuccess(true);

      // TODO: Мониторинг статуса orders через polling
      // Fusion orders выполняются асинхронно через resolvers
      
    } catch (err) {
      console.error('❌ Fusion batch swap error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  /**
   * Выполнить batch swap через sendCalls (Standard mode с gas)
   * Использует EIP-5792 для batch транзакций
   */
  const executeStandardBatchSwap = useCallback(async (params: BatchSwapParams) => {
    if (!address) {
      setError('Wallet not connected');
      return;
    }

    if (!chain) {
      setError('No chain connected');
      return;
    }

    setIsLoading(true);
    setError(null);
    setTxHash(null);
    setBatchId(null);
    setFusionOrders([]);
    setIsSuccess(false);
    setMode('standard');

    try {
      console.log('🚀 Starting standard batch swap (with gas)...');

      const calls: Array<{ to: Address; data: `0x${string}`; value: bigint }> = [];
      const routerAddress = getOneInchRouterAddress(chain.id);

      // Валидация всех routes
      for (const route of params.routes) {
        const validation = validateSwapParams(route);
        if (!validation.valid) {
          throw new Error(`Route validation failed: ${validation.error}`);
        }
      }

      // Подготовка calls для каждого swap
      for (const route of params.routes) {
        const { from, to } = route;
        const amount = parseUnits(from.amount, from.decimals);

        // 1. Approve токена (если нужно)
        if (needsApproval(from.address)) {
          const approveData = createApproveCalldata(amount, routerAddress);
          
          calls.push({
            to: from.address as Address,
            data: approveData,
            value: BigInt(0),
          });

          console.log(`📝 Added approve call for ${from.symbol}`);
        }

        // 2. Получаем данные для swap через Fusion SDK quote
        const quote = await fusionService.getFusionQuote({
          fromTokenAddress: from.address,
          toTokenAddress: to.address,
          amount: amount.toString(),
          walletAddress: address,
        });

        // 3. Создаем swap call
        // Важно: В demo mode это будет моковая транзакция
        // В production нужно использовать реальный calldata от Fusion SDK
        
        const swapCall = {
          to: routerAddress,
          // TODO: Получить реальный calldata от Fusion SDK
          // Пока используем placeholder
          data: '0x12aa3caf' as `0x${string}`, // swap() selector
          value: isNativeToken(from.address) ? amount : BigInt(0),
        };

        calls.push(swapCall);
        console.log(`📝 Added swap call: ${from.symbol} → ${to.symbol}`);
      }

      console.log(`📦 Total calls prepared: ${calls.length}`);

      // Выполняем batch через sendCalls (EIP-5792)
      const result = await sendCalls(config, {
        calls,
        account: address,
        chainId: chain.id,
      });

      console.log('✅ Batch calls sent:', result.id);
      
      setBatchId(result.id);
      setTxHash(result.id); // sendCalls возвращает batch ID, не tx hash

      // Отслеживаем статус batch calls
      // TODO: Использовать getCallsStatus и waitForCallsStatus
      
      setIsSuccess(true);

    } catch (err) {
      console.error('❌ Standard batch swap error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [address, chain]);

  /**
   * Универсальный метод - автоматически выбирает режим
   */
  const executeBatchSwap = useCallback(async (
    params: BatchSwapParams & { mode?: SwapMode }
  ) => {
    const selectedMode = params.mode || 'standard';
    
    if (selectedMode === 'fusion') {
      await executeFusionBatchSwap(params);
    } else {
      await executeStandardBatchSwap(params);
    }
  }, [executeFusionBatchSwap, executeStandardBatchSwap]);

  return {
    executeBatchSwap,
    executeFusionBatchSwap,
    executeStandardBatchSwap,
    isLoading,
    error,
    txHash,
    batchId,
    fusionOrders,
    isSuccess: isSuccess && (mode === 'fusion' || !!transactionReceipt),
    mode,
  };
}


