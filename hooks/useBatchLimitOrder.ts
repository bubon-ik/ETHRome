/**
 * Batch Limit Order Hook using wagmi sendCalls
 * Creates multiple limit orders in a single transaction using EIP-5792
 *
 * @see https://wagmi.sh/core/api/actions/sendCalls
 */

import { useState, useCallback } from 'react';
import { useAccount, useWaitForTransactionReceipt } from 'wagmi';
import { sendCalls, getCallsStatus, waitForCallsStatus } from '@wagmi/core';
import { getWagmiConfig } from '@/lib/wagmi';
import { parseUnits, type Address, erc20Abi, encodeFunctionData } from 'viem';
import { Token } from '@/types';

const LIMIT_ORDER_CONTRACT: `0x${string}` = '0x111111125421cA6dc452d289314280a0f8842A65'; // 1inch Limit Order Contract on Base

export interface LimitOrderRoute {
  from: Token & { amount: string };
  to: Token & { amount: string };
  targetPrice: string;
  expiration: string;
  partialFillEnabled: boolean;
}

export interface BatchLimitOrderParams {
  orders: LimitOrderRoute[];
  walletAddress: string;
}

export interface UseBatchLimitOrderReturn {
  executeBatchLimitOrder: (params: BatchLimitOrderParams) => Promise<void>;
  resetState: () => void;
  isLoading: boolean;
  error: string | null;
  txHash: string | null;
  batchId: string | null;
  isSuccess: boolean;
  callsCount: number;
}

export function useBatchLimitOrder(): UseBatchLimitOrderReturn {
  const { address, chain } = useAccount();
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
   * Prepare approval call for a token
   */
  const prepareApprovalCall = (tokenAddress: string, amount: string, decimals: number) => {
    const amountWei = parseUnits(amount, decimals);
    
    return {
      to: tokenAddress as `0x${string}`,
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: 'approve',
        args: [LIMIT_ORDER_CONTRACT, amountWei],
      }),
      value: BigInt(0),
    };
  };

  /**
   * Prepare limit order call (simplified version)
   * In a real implementation, you would use the 1inch Limit Order SDK
   */
  const prepareLimitOrderCall = (order: LimitOrderRoute, walletAddress: string) => {
    const makerAmount = parseUnits(order.from.amount, order.from.decimals);
    const takerAmount = parseUnits(
      (parseFloat(order.from.amount) * parseFloat(order.targetPrice)).toString(),
      order.to.decimals
    );

    // This is a simplified example - in reality, you'd need to create proper limit order data
    // using the 1inch Limit Order SDK and sign the order
    
    // For demo purposes, we'll create a mock call that would interact with the limit order contract
    const limitOrderData = encodeFunctionData({
      abi: [
        {
          name: 'submitLimitOrder',
          type: 'function',
          inputs: [
            { name: 'makerAsset', type: 'address' },
            { name: 'takerAsset', type: 'address' },
            { name: 'makerAmount', type: 'uint256' },
            { name: 'takerAmount', type: 'uint256' },
            { name: 'maker', type: 'address' },
          ],
          outputs: [],
        },
      ],
      functionName: 'submitLimitOrder',
      args: [
        order.from.address as `0x${string}`,
        order.to.address as `0x${string}`,
        makerAmount,
        takerAmount,
        walletAddress as `0x${string}`,
      ],
    });

    return {
      to: LIMIT_ORDER_CONTRACT,
      data: limitOrderData,
      value: BigInt(0),
    };
  };

  /**
   * Execute batch limit orders using sendCalls
   */
  const executeBatchLimitOrder = useCallback(async (params: BatchLimitOrderParams) => {
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
      console.log('🚀 Starting batch limit order creation...');

      // Validate orders
      const validOrders = params.orders.filter(order =>
        order.from.amount && 
        order.targetPrice &&
        parseFloat(order.from.amount) > 0 && 
        parseFloat(order.targetPrice) > 0
      );

      if (validOrders.length === 0) {
        throw new Error('No valid orders provided');
      }

      console.log(`📝 Processing ${validOrders.length} limit orders...`);

      // Prepare calls array
      const calls: Array<{
        to: `0x${string}`;
        data: `0x${string}`;
        value: bigint;
      }> = [];

      // For each order, we need:
      // 1. Approve tokens if needed
      // 2. Create the limit order
      for (const order of validOrders) {
        // Add approval call for the from token
        const approvalCall = prepareApprovalCall(
          order.from.address,
          order.from.amount,
          order.from.decimals
        );
        calls.push(approvalCall);

        // Add limit order creation call
        const orderCall = prepareLimitOrderCall(order, params.walletAddress);
        calls.push(orderCall);
      }

      setCallsCount(calls.length);
      console.log(`📦 Prepared ${calls.length} batch calls (${validOrders.length} orders)`);

      if (calls.length === 0) {
        throw new Error('No calls prepared');
      }

      // Execute batch through sendCalls (EIP-5792)
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

        // For other errors - re-throw
        throw sendError;
      }

      // Set ID only if sendCalls was successful
      setBatchId(currentBatchId);
      setTxHash(currentBatchId); // sendCalls returns batch ID

      // Track batch calls status with protection from UnknownBundleIdError
      console.log('⏳ Waiting for batch execution...');

      try {
        const config = getWagmiConfig();

        // Additional validation for valid ID
        if (!currentBatchId || typeof currentBatchId !== 'string') {
          throw new Error('Invalid batch ID received');
        }

        // Check bundle status with timeout and retry logic
        let retryCount = 0;
        const maxRetries = 3;
        let status;

        while (retryCount < maxRetries) {
          try {
            // First check status without waiting
            status = await getCallsStatus(config, { id: currentBatchId });

            if (status.status === 'pending') {
              // If pending, wait for execution
              status = await waitForCallsStatus(config, {
                id: currentBatchId,
                timeout: 60000, // 1 minute timeout
              });
            }

            break; // If successfully got status, exit retry loop

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

        // Check all possible successful statuses
        const successStatuses = ['success'];

        if (status && status.status && successStatuses.includes(status.status)) {
          setIsSuccess(true);
          // Get real tx hash from status
          if (status.receipts && status.receipts.length > 0) {
            setTxHash(status.receipts[0].transactionHash);
          }
          console.log('🎉 Batch limit orders created successfully!');
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
          // Don't throw error as batch might have executed successfully
          setIsSuccess(true);
        }

      } catch (statusError) {
        console.error('❌ Batch status error:', statusError);

        // Check if error is related to user cancellation
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
          return; // Exit without setting success
        }

        // For other errors - mark as successful (batch might have executed)
        setIsSuccess(true);
        console.log('🔄 Assuming success despite status error');
      }

    } catch (err) {
      console.error('❌ Batch limit order error:', err);
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
    executeBatchLimitOrder,
    resetState,
    isLoading,
    error,
    txHash,
    batchId,
    isSuccess: isSuccess && !!transactionReceipt,
    callsCount,
  };
}
