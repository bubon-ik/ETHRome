/**
 * Simple Batch Swap Hook - без Fusion SDK
 * Использует wagmi sendCalls для batch транзакций
 * 
 * @see https://wagmi.sh/core/api/actions/sendCalls
 */

import { useState, useCallback } from 'react';
import { useAccount, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { sendCalls, getCallsStatus, waitForCallsStatus } from '@wagmi/core';
import { getWagmiConfig } from '@/lib/wagmi';
import { parseUnits, type Address } from 'viem';
import { SwapRoute } from '@/types';
import { simpleSwapService, type SwapParams, type BatchSwapCall } from '@/lib/simple-swap';

export interface BatchSwapParams {
  routes: SwapRoute[];
  recipient: string;
  deadline: number;
  slippage: number;
}

export interface UseSimpleBatchSwapReturn {
  executeBatchSwap: (params: BatchSwapParams) => Promise<void>;
  resetState: () => void;
  isLoading: boolean;
  error: string | null;
  txHash: string | null;
  batchId: string | null;
  isSuccess: boolean;
  callsCount: number;
}

export function useSimpleBatchSwap(): UseSimpleBatchSwapReturn {
  const { address, chain } = useAccount();
  const publicClient = usePublicClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [callsCount, setCallsCount] = useState(0);

  const { data: transactionReceipt } = useWaitForTransactionReceipt({
    hash: txHash as `0x${string}` | undefined,
  });

  /**
   * Выполнить batch swap через sendCalls
   */
  const executeBatchSwap = useCallback(async (params: BatchSwapParams) => {
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
    setIsSuccess(false);
    setCallsCount(0);

    let currentBatchId: string | null = null;

    try {
      console.log('🚀 Starting simple batch swap...');

      // Валидация routes
      const validRoutes = params.routes.filter(route => 
        route.from.amount && parseFloat(route.from.amount) > 0
      );

      if (validRoutes.length === 0) {
        throw new Error('No valid routes provided');
      }

      console.log(`📝 Processing ${validRoutes.length} swap routes...`);

      // Подготавливаем swap параметры
      const swapParams: SwapParams[] = validRoutes.map(route => ({
        fromToken: route.from,
        toToken: route.to,
        amount: route.from.amount,
        walletAddress: address,
        slippage: params.slippage,
      }));

      // Определяем, нужен ли batch или одиночный swap
      let calls;
      if (swapParams.length === 1) {
        // Одиночный swap - используем оптимизированную логику
        calls = await simpleSwapService.prepareSingleSwapCall(swapParams[0]);
      } else {
        // Множественные свапы - используем batch логику
        calls = await simpleSwapService.prepareBatchSwapCalls({
          swaps: swapParams,
          walletAddress: address,
          slippage: params.slippage,
        });
      }

      setCallsCount(calls.length);
      console.log(`📦 Prepared ${calls.length} batch calls`);

      if (calls.length === 0) {
        throw new Error('No calls prepared');
      }

      // Выполняем batch через sendCalls (EIP-5792)
      console.log('📡 Sending batch calls...');
      
      const config = getWagmiConfig();
      console.log('🔍 Config check:', !!config, 'Chain:', chain?.id, 'Account:', address);
      
      let result;
      try {
        result = await sendCalls(config, {
          calls,
          account: address,
        });
        
        if (!result || !result.id) {
          throw new Error('No valid batch ID received from sendCalls');
        }
        
        console.log('✅ Batch calls sent:', result.id);
        currentBatchId = result.id;
      } catch (sendError) {
        const errorMessage = sendError instanceof Error ? sendError.message : String(sendError);
        
        if (errorMessage.includes('User rejected') || 
            errorMessage.includes('rejected') ||
            errorMessage.includes('cancelled') ||
            errorMessage.includes('denied') ||
            errorMessage.includes('ACTION_REJECTED')) {
          
          console.log('🚫 Transaction was cancelled by user during sendCalls');
          setError('Transaction cancelled by user');
          setIsSuccess(false);
          return;
        }
        
        // Для других ошибок - пробрасываем дальше
        throw sendError;
      }
      
      // Только устанавливаем ID если sendCalls прошел успешно
      setBatchId(currentBatchId);
      setTxHash(currentBatchId); // sendCalls возвращает batch ID

      // Отслеживаем статус batch calls с защитой от UnknownBundleIdError
      console.log('⏳ Waiting for batch execution...');
      
      try {
        const config = getWagmiConfig();
        
        // Дополнительная проверка на валидность ID
        if (!currentBatchId || typeof currentBatchId !== 'string') {
          throw new Error('Invalid batch ID received');
        }
        
        // Проверяем статус bundle с timeout и retry логикой
        let retryCount = 0;
        const maxRetries = 3;
        let status;
        
        while (retryCount < maxRetries) {
          try {
            // Сначала проверяем статус без ожидания
            status = await getCallsStatus(config, { id: currentBatchId });
            
            if (status.status === 'pending') {
              // Если pending, ждем выполнения
              status = await waitForCallsStatus(config, {
                id: currentBatchId,
                timeout: 60000, // Уменьшенный timeout - 1 минута
              });
            }
            
            break; // Если успешно получили статус, выходим из retry loop
            
          } catch (retryError) {
            retryCount++;
            const retryErrorMessage = retryError instanceof Error ? retryError.message : String(retryError);
            
            if (retryErrorMessage.includes('UnknownBundleIdError') || 
                retryErrorMessage.includes('bundle id is unknown') ||
                retryErrorMessage.includes('No matching bundle found')) {
              
              if (retryCount >= maxRetries) {
                console.log('🚫 Bundle ID became invalid - transaction likely cancelled');
                setError('Transaction was cancelled or timed out');
                setIsSuccess(false);
                setBatchId(null);
                setTxHash(null);
                return;
              }
              
              // Wait before retry
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
              console.log(`🔄 Retrying status check (${retryCount}/${maxRetries})...`);
            } else {
              throw retryError; // Re-throw non-bundle-id errors
            }
          }
        }

        console.log('✅ Batch execution completed:', status);
        
        // Проверяем все возможные успешные статусы
        const successStatuses = ['success'];
        
        if (status && status.status && successStatuses.includes(status.status)) {
          setIsSuccess(true);
          // Получаем реальный tx hash из статуса
          if (status.receipts && status.receipts.length > 0) {
            setTxHash(status.receipts[0].transactionHash);
          }
          console.log('🎉 Batch swap completed successfully!');
        } else if (status && status.status === 'pending') {
          // If still pending after timeout, consider it successful but pending
          setIsSuccess(true);
          console.log('⏳ Transaction is still pending but likely will complete');
        } else if (status && status.status === 'failure') {
          console.log('❌ Transaction failed');
          setError('Transaction failed');
          setIsSuccess(false);
        } else {
          console.warn('⚠️ Unexpected status:', status?.status);
          // Не выбрасываем ошибку, так как batch мог выполниться успешно
          setIsSuccess(true);
        }
        
      } catch (statusError) {
        console.error('❌ Batch status error:', statusError);
        
        // Проверяем, является ли ошибка связанной с отменой пользователем
        const errorMessage = statusError instanceof Error ? statusError.message : String(statusError);
        
        if (errorMessage.includes('UnknownBundleIdError') || 
            errorMessage.includes('bundle id is unknown') ||
            errorMessage.includes('No matching bundle found') ||
            errorMessage.includes('User rejected') ||
            errorMessage.includes('rejected') ||
            errorMessage.includes('cancelled') ||
            errorMessage.includes('denied')) {
          
          console.log('🚫 Transaction was cancelled or bundle not found');
          setError('Transaction was cancelled by user');
          setIsSuccess(false);
          
          // Reset batch ID since it's invalid
          setBatchId(null);
          setTxHash(null);
          return; // Выходим без установки success
        }
        
        // Для других ошибок - помечаем как успешный (возможно batch выполнился)
        setIsSuccess(true);
        console.log('🔄 Assuming success despite status error');
      }

    } catch (err) {
      console.error('❌ Simple batch swap error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [address, chain]);

  const resetState = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setTxHash(null);
    setBatchId(null);
    setIsSuccess(false);
    setCallsCount(0);
  }, []);

  return {
    executeBatchSwap,
    resetState,
    isLoading,
    error,
    txHash,
    batchId,
    isSuccess: isSuccess && !!transactionReceipt,
    callsCount,
  };
}

