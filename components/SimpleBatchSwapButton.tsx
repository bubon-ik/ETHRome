import React, { useState, useEffect } from 'react';
import { useAccount, useEnsAddress } from 'wagmi';
import { mainnet } from 'viem/chains';
import { parseUnits, isAddress } from 'viem';
import { SwapRoute } from '@/types';
import { useSimpleBatchSwap } from '@/hooks/useSimpleBatchSwap';
import { simpleSwapService } from '@/lib/simple-swap';
import { UserIcon } from '@heroicons/react/24/outline';

interface SimpleBatchSwapButtonProps {
    routes: SwapRoute[];
    slippage: number;
    deadline: number;
}

const SimpleBatchSwapButton: React.FC<SimpleBatchSwapButtonProps> = ({
    routes,
    slippage,
    deadline,
}) => {
    const { address } = useAccount();
    const {
        executeBatchSwap,
        resetState,
        isLoading,
        error,
        txHash,
        batchId,
        isSuccess,
        callsCount
    } = useSimpleBatchSwap();
    const [quotes, setQuotes] = useState<any[]>([]);
    const [totalGas, setTotalGas] = useState<string>('0');
    const [isGettingQuotes, setIsGettingQuotes] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [lastSwapTime, setLastSwapTime] = useState(0);
    const [recipientInput, setRecipientInput] = useState<string>('');
    const [showRecipientField, setShowRecipientField] = useState(false);

    const isEnsName = recipientInput.includes('.');
    const {
        data: resolvedAddress,
        isLoading: isResolvingEns,
        error: ensError
    } = useEnsAddress({ name: recipientInput, chainId: mainnet.id });    // Избегаем hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    // Reset state on unmount to prevent stale bundle ID errors
    useEffect(() => {
        return () => {
            resetState();
        };
    }, [resetState]);

    // Auto-clear errors after some time (longer for cancellations)
    useEffect(() => {
        if (error) {
            const isCancellation = error.includes('cancelled') || error.includes('canceled');
            const clearTime = isCancellation ? 8000 : 5000; // 8s for cancellations, 5s for errors

            const timer = setTimeout(() => {
                resetState();
            }, clearTime);
            return () => clearTimeout(timer);
        }
    }, [error, resetState]);

    // Get quotes for all routes with debouncing to avoid rate limiting
    useEffect(() => {
        const getQuotes = async () => {
            if (!routes.some(route => route.from.amount && parseFloat(route.from.amount) > 0)) {
                setQuotes([]);
                setTotalGas('0');
                return;
            }

            setIsGettingQuotes(true);

            try {
                const quotePromises = routes.map(async (route) => {
                    // Skip routes with no amount or invalid amounts
                    const amount = parseFloat(route.from.amount || '0');
                    if (!route.from.amount || amount === 0 || isNaN(amount)) return null;

                    try {
                        const quote = await simpleSwapService.getQuote({
                            fromToken: route.from,
                            toToken: route.to,
                            amount: route.from.amount,
                            walletAddress: address || '0x0000000000000000000000000000000000000000',
                            slippage,
                        });

                        return quote;
                    } catch (error) {
                        console.error('Quote error for route:', route, error);
                        return null;
                    }
                });

                const routeQuotes = await Promise.all(quotePromises);
                const validQuotes = routeQuotes.filter(quote =>
                    quote &&
                    quote.fromToken &&
                    quote.toToken &&
                    quote.fromToken.symbol &&
                    quote.toToken.symbol
                );
                setQuotes(validQuotes);

                // Calculate total gas
                const gas = validQuotes.reduce((acc, quote) => acc + parseInt(quote?.gas || '0'), 0);
                setTotalGas((gas / 1e9).toFixed(2)); // Convert to GWEI

            } catch (err) {
                console.error('Failed to get quotes:', err);
                setQuotes([]);
                setTotalGas('0');
            } finally {
                setIsGettingQuotes(false);
            }
        };

        // Debounce API calls to avoid rate limiting (429 errors)
        const timeoutId = setTimeout(() => {
            getQuotes();
        }, 500); // Wait 500ms after user stops typing

        return () => clearTimeout(timeoutId);
    }, [routes, address, slippage]);

    const handleSwap = async () => {
        if (!address) return;

        // Prevent rapid successive clicks (debounce)
        const now = Date.now();
        if (now - lastSwapTime < 2000) { // 2 second cooldown
            console.log('🚫 Swap attempt too soon, ignoring');
            return;
        }
        setLastSwapTime(now);

        const validRoutes = routes.filter(
            route => route.from.amount && parseFloat(route.from.amount) > 0
        );

        if (validRoutes.length === 0) return;

        // Clear any previous error before starting new swap
        if (error) {
            resetState();
        }

        // Determine recipient - use custom address if valid, otherwise use connected wallet address
        const recipient = showRecipientField && (resolvedAddress || (isAddress(recipientInput) ? recipientInput : null))
            ? (resolvedAddress || recipientInput)
            : address;

        await executeBatchSwap({
            routes: validRoutes,
            recipient,
            deadline: Date.now() + deadline * 60 * 1000,
            slippage,
        });
    };

    const isDisabled = !mounted || !address ||
        !routes.some(route => route.from.amount && parseFloat(route.from.amount) > 0) ||
        isLoading ||
        isGettingQuotes ||
        (showRecipientField && !!recipientInput && !isAddress(recipientInput) && !isResolvingEns && !resolvedAddress) ||
        (showRecipientField && isResolvingEns);

    const getButtonText = () => {
        if (!mounted) return 'Loading...';
        if (!address) return 'Connect Wallet';
        if (isGettingQuotes) return 'Getting Quotes...';
        if (isLoading) return 'Executing Batch Swap...';
        if (!routes.some(route => route.from.amount && parseFloat(route.from.amount) > 0)) {
            return 'Enter Amount';
        }

        const count = routes.filter(r => r.from.amount && parseFloat(r.from.amount) > 0).length;
        const baseText = `Swap ${count} Token${count !== 1 ? 's' : ''}`;

        if (showRecipientField && (resolvedAddress || (recipientInput && isAddress(recipientInput)))) {
            return `${baseText} to Recipient`;
        }

        return baseText;
    };

    const formatAmount = (amount: string, decimals: number) => {
        const num = parseFloat(amount) / Math.pow(10, decimals);
        return num.toFixed(6);
    };

    return (
        <div className="space-y-4">
            {/* Service Status */}
            <div className="liquid-glass rounded-2xl p-3 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30">
                <div className="flex items-center gap-2">
                    <span className="text-lg">🔄</span>
                    <div>
                        <div className="text-sm font-semibold text-blue-900 dark:text-blue-200">Simple Swap Mode</div>
                        <div className="text-xs text-blue-800 dark:text-blue-100/90">
                            Using 1inch API + wagmi sendCalls for batch swaps
                        </div>
                    </div>
                </div>
            </div>

            {/* Recipient toggle and input */}
            <div className="liquid-glass rounded-2xl p-4 bg-glass-white-5">
                <div className="flex items-center justify-between mb-3">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-white/90">
                        <UserIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 dark:text-blue-300" />
                        Send tokens to another address
                    </label>
                    <div className="relative inline-block w-12 align-middle select-none transition duration-200 ease-in">
                        <input
                            type="checkbox"
                            name="toggle"
                            id="recipient-toggle"
                            checked={showRecipientField}
                            onChange={() => {
                                setShowRecipientField(!showRecipientField);
                                if (!showRecipientField) {
                                    setRecipientInput('');
                                }
                            }}
                            className="absolute block w-6 h-6 rounded-full bg-white dark:bg-gray-200 border-4 border-gray-300 dark:border-gray-600 appearance-none cursor-pointer transition-transform duration-300 ease-in checked:translate-x-full checked:border-blue-500 dark:checked:border-blue-400 z-10"
                        />
                        <label
                            htmlFor="recipient-toggle"
                            className="block h-6 overflow-hidden rounded-full cursor-pointer bg-gray-300 dark:bg-gray-600"
                        ></label>
                    </div>
                </div>

                {showRecipientField && (
                    <div className="mt-3 transition-all duration-300 ease-in-out">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <UserIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Enter Base recipient address or ENS name (.eth)"
                                value={recipientInput}
                                onChange={(e) => setRecipientInput(e.target.value)}
                                className="w-full pl-10 pr-3 py-2.5 border border-white/30 dark:border-white/20 bg-white/20 dark:bg-black/20 text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm transition-colors duration-300"
                            />
                        </div>
                        {isResolvingEns && (
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1.5 flex items-center">
                                <span className="mr-1">Resolving ENS name...</span>
                            </p>
                        )}
                        {recipientInput && !isAddress(recipientInput) && !isEnsName && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1.5 flex items-center">
                                <span className="mr-1">⚠️</span> Please enter a valid Base address or ENS name
                            </p>
                        )}
                        {ensError && isEnsName && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1.5 flex items-center">
                                <span className="mr-1">⚠️</span> Could not resolve ENS name: {ensError.message}
                            </p>
                        )}
                        {(resolvedAddress || (recipientInput && isAddress(recipientInput) && !isEnsName)) && (
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1.5 flex items-center">
                                <span className="mr-1">✓</span> Valid recipient: {resolvedAddress ? `${recipientInput} -> ${resolvedAddress.slice(0, 6)}...${resolvedAddress.slice(-4)}` : `${recipientInput.slice(0, 6)}...${recipientInput.slice(-4)}`}
                            </p>
                        )}
                    </div>
                )}
            </div>            {/* Swap Summary */}
            {quotes.length > 0 && (
                <div className="liquid-glass rounded-2xl p-4 bg-glass-white-5">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-white mb-3">Swap Summary</h3>
                    <div className="space-y-2">
                        {quotes.map((quote, index) => (
                            <div key={index} className="flex justify-between items-center text-sm">
                                <span className="text-gray-600 dark:text-white/70">
                                    {quote?.fromToken?.symbol || 'Unknown'} → {quote?.toToken?.symbol || 'Unknown'}
                                </span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {formatAmount(quote?.toAmount || '0', quote?.toToken?.decimals || 18)} {quote?.toToken?.symbol || 'Unknown'}
                                </span>
                            </div>
                        ))}
                        <div className="pt-2 border-t border-gray-300 dark:border-white/20">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600 dark:text-white/70">Total Gas (est.)</span>
                                <span className="font-medium text-gray-900 dark:text-white">{totalGas} GWEI</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600 dark:text-white/70">Batch Calls</span>
                                <span className="font-medium text-gray-900 dark:text-white">{callsCount || quotes.length * 2}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Error/Cancellation Display */}
            {error && (
                <div className={`liquid-glass rounded-2xl p-4 border ${error.includes('cancelled') || error.includes('canceled')
                    ? 'bg-orange-500/20 border-orange-400/30' // Orange for cancellations
                    : 'bg-red-500/20 border-red-400/30' // Red for actual errors
                    }`}>
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2 flex-1">
                            <span className="text-lg">
                                {error.includes('cancelled') || error.includes('canceled') ? '🚫' : '⚠️'}
                            </span>
                            <div className={`text-sm ${error.includes('cancelled') || error.includes('canceled')
                                ? 'text-orange-800 dark:text-orange-200'
                                : 'text-red-800 dark:text-red-200'
                                }`}>
                                <p className="font-semibold">{error}</p>
                                {(error.includes('cancelled') || error.includes('canceled')) && (
                                    <p className="text-xs mt-1 opacity-90">
                                        You can try again when you're ready to complete the transaction.
                                    </p>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={resetState}
                            className={`ml-2 hover:opacity-75 ${error.includes('cancelled') || error.includes('canceled')
                                ? 'text-orange-800 dark:text-orange-200'
                                : 'text-red-800 dark:text-red-200'
                                }`}
                            title="Dismiss notification"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

            {/* Success Display */}
            {isSuccess && txHash && (
                <div className="liquid-glass rounded-2xl p-4 bg-green-500/20 border border-green-400/30">
                    <p className="text-green-800 dark:text-green-200 text-sm font-semibold mb-1">
                        ✅ Batch Swap Successful!
                    </p>
                    <p className="text-green-700 dark:text-green-100 text-xs">
                        Transaction confirmed!
                        <a
                            href={`https://basescan.org/tx/${txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-1 underline hover:no-underline text-green-800 dark:text-green-200"
                        >
                            View on BaseScan
                        </a>
                    </p>
                    {showRecipientField && (resolvedAddress || (recipientInput && isAddress(recipientInput))) && (
                        <p className="text-green-700 dark:text-green-100 text-xs mt-1">
                            Tokens sent to: <span className="font-mono text-green-800 dark:text-green-200">
                                {resolvedAddress ? `${recipientInput} (${resolvedAddress.slice(0, 6)}...${resolvedAddress.slice(-4)})` : recipientInput}
                            </span>
                        </p>
                    )}
                    {batchId && (
                        <p className="text-green-700 dark:text-green-100 text-xs mt-1">
                            Batch ID: <span className="font-mono text-green-800 dark:text-green-200">{batchId}</span>
                        </p>
                    )}
                </div>
            )}

            {/* Swap Button */}
            <button
                onClick={handleSwap}
                disabled={isDisabled}
                className={`w-full py-4 px-6 font-semibold text-lg transition-all duration-300 ${isDisabled
                    ? 'liquid-glass bg-glass-white-5 text-gray-500 dark:text-white/50 cursor-not-allowed rounded-2xl'
                    : 'liquid-glass-button hover:shadow-glass-lg'
                    }`}
            >
                {isLoading && (
                    <div className="inline-block w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {getButtonText()}
            </button>
        </div>
    );
};

export default SimpleBatchSwapButton;
