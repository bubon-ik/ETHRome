import { useAccount, useSwitchChain } from 'wagmi';
import { useState } from 'react';
import { parseUnits, erc20Abi } from 'viem';
import { readContract, signTypedData, waitForTransactionReceipt, writeContract } from '@wagmi/core';
import { getWagmiConfig } from '@/lib/wagmi';
import { base } from 'wagmi/chains';
import { MakerTraits, Address, Sdk, randBigInt, FetchProviderConnector } from '@1inch/limit-order-sdk';
import { withRetry, globalCircuitBreaker, globalRateLimiter } from '@/lib/retry-utils';

const CHAIN_ID = 8453;
const LIMIT_ORDER_CONTRACT: `0x${string}` = '0x111111125421cA6dc452d289314280a0f8842A65';

export const useLimitOrder = () => {
    const { address, isConnected, chainId } = useAccount();
    const { switchChain } = useSwitchChain();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [transactions, setTransactions] = useState<number>(0);
    const [currentTx, setCurrentTx] = useState<number>(0);

    const ensureAllowance = async (tokenAddress: string, requiredAmount: bigint) => {
        if (!address) return;

        const formattedToken = tokenAddress as `0x${string}`;
        const owner = address as `0x${string}`;

        try {
            // Apply rate limiting before making requests
            await globalRateLimiter.waitIfNeeded();
            
            // Use circuit breaker and retry logic for allowance check
            const currentAllowance = await globalCircuitBreaker.execute(async () => {
                return await withRetry(async () => {
                    return (await readContract(getWagmiConfig(), {
                        address: formattedToken,
                        abi: erc20Abi,
                        functionName: 'allowance',
                        args: [owner, LIMIT_ORDER_CONTRACT],
                    })) as bigint;
                }, {
                    maxRetries: 3,
                    baseDelay: 1000,
                });
            });

            if (currentAllowance >= requiredAmount) {
                return;
            }

            setCurrentTx(prev => prev + 1);
            
            // Use circuit breaker and retry logic for approval transaction
            const hash = await globalCircuitBreaker.execute(async () => {
                return await withRetry(async () => {
                    return await writeContract(getWagmiConfig(), {
                        address: formattedToken,
                        abi: erc20Abi,
                        functionName: 'approve',
                        args: [LIMIT_ORDER_CONTRACT, requiredAmount],
                    });
                }, {
                    maxRetries: 3,
                    baseDelay: 1000,
                });
            });

            // Use circuit breaker and retry logic for transaction receipt
            await globalCircuitBreaker.execute(async () => {
                return await withRetry(async () => {
                    return await waitForTransactionReceipt(getWagmiConfig(), { hash });
                }, {
                    maxRetries: 5,
                    baseDelay: 2000,
                });
            });
        } catch (error) {
            if (error instanceof Error &&
                (error.message.includes('User denied') ||
                    error.message.includes('User rejected') ||
                    error.message.toLowerCase().includes('user denied transaction signature'))) {
                throw new Error('Transaction was rejected by user');
            }
            throw error;
        }
    };

    const createLimitOrder = async (
        orders: Array<{
            tokenIn: string,
            tokenOut: string,
            amountIn: string,
            amountOut: string,
            decimalsIn: number,
            decimalsOut?: number
        }>
    ) => {
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

        // Assume orders are already validated at UI level

        try {
            setLoading(true);
            setError(null);
            setCurrentTx(0);

            setTransactions(orders.length * 2); // Each order needs approval + signature

            for (let i = 0; i < orders.length; i++) {
                const { tokenIn, tokenOut, amountIn, amountOut, decimalsIn, decimalsOut } = orders[i];

                const makerAsset = tokenIn;
                const takerAsset = tokenOut;

                const makingAmount = parseUnits(amountIn, decimalsIn);
                const takingAmount = parseUnits(amountOut, decimalsOut || 18);

                // For approval transaction
                await ensureAllowance(makerAsset, makingAmount);

                const sdk = new Sdk({
                    networkId: CHAIN_ID,
                    baseUrl: "https://1inch-vercel-proxy-theta.vercel.app/orderbook/v4.1",
                    authKey: process.env.NEXT_PUBLIC_ONEINCH_API_KEY || '',
                    httpConnector: new FetchProviderConnector(),
                });

                const makerTraits = MakerTraits.default()
                    .withAnySender()
                    .allowPartialFills()
                    .allowMultipleFills()
                    .withExpiration(BigInt(Math.floor(Date.now() / 1000) + 3600))
                    .withNonce(randBigInt((BigInt(1) << BigInt(40)) - BigInt(1)));

                const order = await sdk.createOrder({
                    maker: new Address(address),
                    makerAsset: new Address(makerAsset),
                    takerAsset: new Address(takerAsset),
                    makingAmount,
                    takingAmount,
                }, makerTraits);

                const typedData = order.getTypedData(CHAIN_ID);

                // For signature transaction
                setCurrentTx(prev => prev + 1);
                
                // Apply rate limiting before signature
                await globalRateLimiter.waitIfNeeded();
                
                const signature = await globalCircuitBreaker.execute(async () => {
                    return await withRetry(async () => {
                        return await signTypedData(getWagmiConfig(), {
                            account: address,
                            types: typedData.types,
                            primaryType: typedData.primaryType,
                            domain: typedData.domain,
                            message: typedData.message,
                        });
                    }, {
                        maxRetries: 2,
                        baseDelay: 500,
                    });
                });

                await globalCircuitBreaker.execute(async () => {
                    return await withRetry(async () => {
                        return await sdk.submitOrder(order, signature);
                    }, {
                        maxRetries: 3,
                        baseDelay: 1000,
                    });
                });
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';

            if (message.includes('Transaction was rejected by user') ||
                message.includes('User denied') ||
                message.includes('User rejected') ||
                message.toLowerCase().includes('user denied transaction signature')) {
                setError('Transaction was cancelled by user');
                return;
            } else if (message.includes('429') || 
                      message.includes('rate limit') ||
                      message.includes('over rate limit') ||
                      message.includes('Circuit breaker is OPEN')) {
                setError('Network is temporarily overloaded. Please try again in a few moments.');
                return;
            } else if (message.includes('Failed after') && message.includes('attempts')) {
                setError('Network request failed after multiple attempts. Please check your connection and try again.');
                return;
            } else {
                setError(message);
                throw err;
            }
        } finally {
            setLoading(false);
            setCurrentTx(0);
            setTransactions(0);
        }
    };

    return { createLimitOrder, loading, error, transactions, currentTx };
};
