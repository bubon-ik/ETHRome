import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { SwapRoute } from '@/types';
import { useBatchSwap, type SwapMode } from '@/hooks/useBatchSwap';
import { fusionService } from '@/lib/1inch-fusion';
import { formatAmount } from '@/lib/fusion-utils';

interface BatchSwapButtonProps {
  routes: SwapRoute[];
  slippage: number;
  deadline: number;
  mode?: SwapMode; // 'fusion' для gasless, 'standard' для обычного
}

const BatchSwapButton: React.FC<BatchSwapButtonProps> = ({
  routes,
  slippage,
  deadline,
  mode = 'fusion', // По умолчанию gasless режим
}) => {
  const { address } = useAccount();
  const { 
    executeBatchSwap, 
    isLoading, 
    error, 
    txHash, 
    batchId,
    fusionOrders,
    isSuccess,
    mode: currentMode 
  } = useBatchSwap();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [totalGas, setTotalGas] = useState<string>('0');
  const [isGettingQuotes, setIsGettingQuotes] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showFusionInfo, setShowFusionInfo] = useState(false);
  const [fusionStatus, setFusionStatus] = useState<'loading' | 'working' | 'demo' | 'error'>('loading');

  // Избегаем hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get quotes for all routes using Fusion SDK
  useEffect(() => {
    const getQuotes = async () => {
      if (!routes.some(route => route.from.amount && parseFloat(route.from.amount) > 0)) {
        setQuotes([]);
        setTotalGas('0');
        return;
      }

      setIsGettingQuotes(true);

      try {
        setFusionStatus('working');
        const routeQuotes = await Promise.all(
          routes
            .filter(route => route.from.amount && parseFloat(route.from.amount) > 0)
            .map(async (route) => {
              try {
                const amount = parseUnits(route.from.amount, route.from.decimals || 18);
                
                if (mode === 'fusion') {
                  // Используем Fusion SDK для gasless котировок
                  const quote = await fusionService.getQuote({
                    srcToken: route.from.address || '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
                    dstToken: route.to.address || '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
                    amount: amount.toString(),
                    from: address || '0x1234567890123456789012345678901234567890'
                  });
                  
                  return {
                    ...quote,
                    fromToken: route.from,
                    toToken: route.to,
                    fromAmount: amount,
                    mode: 'fusion'
                  };
                } else {
                  // Стандартная котировка через 1inch API
                  const response = await fetch(`/api/1inch/quote?chainId=8453&src=${route.from.address}&dst=${route.to.address}&amount=${amount}&includeGas=true`);
                  if (!response.ok) throw new Error('Quote failed');
                  
                  const quote = await response.json();
                  return {
                    ...quote,
                    fromToken: route.from,
                    toToken: route.to,
                    fromAmount: amount,
                    mode: 'standard'
                  };
                }
              } catch (err) {
                console.error('Quote error for route:', err);
                // Fallback к demo данным
                setFusionStatus('demo');
                return {
                  toAmount: (BigInt(route.from.amount) * BigInt(95) / BigInt(100)).toString(),
                  fromToken: route.from,
                  toToken: route.to,
                  fromAmount: parseUnits(route.from.amount, route.from.decimals || 18),
                  gas: '150000',
                  mode: 'demo'
                };
              }
            })
        );

        setQuotes(routeQuotes);
        
        // Calculate total gas
        const totalGasWei = routeQuotes.reduce((sum, quote) => {
          const gas = quote.gas ? BigInt(quote.gas) : BigInt(150000);
          return sum + gas;
        }, BigInt(0));
        
        setTotalGas((Number(totalGasWei) / 1e9).toFixed(2));
        
      } catch (error) {
        console.error('Error getting quotes:', error);
        setFusionStatus('error');
        setQuotes([]);
        setTotalGas('0');
      } finally {
        setIsGettingQuotes(false);
      }
    };

    if (mounted && address) {
      getQuotes();
    }
  }, [routes, address, mounted, mode]);

  const handleSwap = async () => {
    if (!address || quotes.length === 0) return;

    try {
      await executeBatchSwap(routes, slippage, deadline, mode);
    } catch (error) {
      console.error('Swap failed:', error);
    }
  };

  const isDisabled = !address || quotes.length === 0 || isLoading || isGettingQuotes;

  const getButtonText = () => {
    if (!mounted) return 'Loading...';
    if (!address) return 'Connect Wallet';
    if (isGettingQuotes) return 'Getting Quotes...';
    if (isLoading) {
      return mode === 'fusion' 
        ? 'Creating Fusion Orders...'
        : 'Executing Batch Swap...';
    }
    if (!routes.some(route => route.from.amount && parseFloat(route.from.amount) > 0)) {
      return 'Enter Amount';
    }
    const count = routes.filter(r => r.from.amount && parseFloat(r.from.amount) > 0).length;
    const modeLabel = mode === 'fusion' ? ' (Gasless ⚡)' : '';
    return `Swap ${count} Token${count !== 1 ? 's' : ''}${modeLabel}`;
  };

  return (
    <div className="space-y-4">
      {/* Mode Indicator */}
      {mode === 'fusion' && (
        <div className="bg-gradient-to-r from-blue-50/80 to-purple-50/80 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-3 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              <div>
                <div className="text-sm font-semibold text-blue-900 dark:text-blue-200">Gasless Mode (Fusion)</div>
                <div className="text-xs text-blue-700 dark:text-blue-300">
                  {fusionStatus === 'loading' && '🔄 Checking Fusion SDK...'}
                  {fusionStatus === 'working' && '✅ Fusion SDK active - Real gasless swaps!'}
                  {fusionStatus === 'demo' && '📝 Demo mode - Simulated gasless swaps'}
                  {fusionStatus === 'error' && '⚠️ Fallback mode - Using demo quotes'}
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowFusionInfo(!showFusionInfo)}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 text-xs underline"
            >
              {showFusionInfo ? 'Hide' : 'Info'}
            </button>
          </div>
          {showFusionInfo && (
            <div className="mt-2 text-xs text-blue-800 dark:text-blue-200 border-t border-blue-200 dark:border-blue-700 pt-2">
              {fusionStatus === 'working' && 'Fusion SDK работает! Создаются реальные off-chain orders которые выполняются resolvers.'}
              {fusionStatus === 'demo' && 'Fusion SDK в demo режиме. Показываются симулированные котировки и orders.'}
              {fusionStatus === 'error' && 'Fusion SDK недоступен. Используется fallback режим с demo котировками.'}
            </div>
          )}
        </div>
      )}

      {/* Swap Summary */}
      {quotes.length > 0 && (
        <div className="bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-lg sm:rounded-xl p-3 sm:p-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {mode === 'fusion' ? 'Fusion Orders Preview' : 'Swap Summary'}
          </h3>
          <div className="space-y-2">
            {quotes.map((quote, index) => (
              <div key={index} className="flex justify-between items-center text-xs sm:text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Route #{index + 1}
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatUnits(BigInt(quote.toAmount), routes[index]?.to.decimals || 18).slice(0, 8)} {routes[index]?.to.symbol}
                </span>
              </div>
            ))}
            <div className="pt-2 border-t border-white/20 dark:border-white/10">
              <div className="flex justify-between items-center text-xs sm:text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  {mode === 'fusion' ? 'Gas Fee' : 'Total Gas (est.)'}
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {mode === 'fusion' ? 'FREE ⚡' : `${totalGas} GWEI`}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fusion Orders Status */}
      {fusionOrders.length > 0 && (
        <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 backdrop-blur-sm">
          <h3 className="text-sm font-semibold text-green-900 dark:text-green-300 mb-2">
            ✅ Fusion Orders Created ({fusionOrders.length})
          </h3>
          <div className="space-y-2 text-xs text-green-800 dark:text-green-200">
            {fusionOrders.map((order, index) => (
              <div key={index} className="font-mono bg-green-100/50 dark:bg-green-900/30 p-2 rounded">
                Order {index + 1}: {order.orderHash?.substring(0, 20)}...
              </div>
            ))}
            <p className="text-green-700 dark:text-green-300 text-xs mt-2">
              Orders submitted! Resolvers will execute them when profitable. No gas fees for you! ⚡
            </p>
          </div>
        </div>
      )}

      {/* Success Display */}
      {isSuccess && txHash && (
        <div className="bg-green-500/20 border border-green-500/30 rounded-lg sm:rounded-xl p-3 sm:p-4 backdrop-blur-sm">
          <p className="text-green-700 dark:text-green-300 text-xs sm:text-sm">
            {mode === 'fusion' ? '⚡ Fusion Orders Submitted!' : '✅ Batch Swap Successful!'}
            {mode !== 'fusion' && (
              <a
                href={`https://basescan.org/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 underline hover:no-underline font-medium"
              >
                View on BaseScan
              </a>
            )}
          </p>
        </div>
      )}

      {/* Swap Button */}
      <button
        onClick={handleSwap}
        disabled={isDisabled}
        className={`w-full py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl font-semibold text-base sm:text-lg transition-all duration-200 ${
          isDisabled
            ? 'bg-gray-400/20 text-gray-500 cursor-not-allowed backdrop-blur-sm border border-gray-400/30'
            : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl backdrop-blur-sm'
        }`}
      >
        {isLoading && (
          <div className="inline-block w-4 h-4 sm:w-5 sm:h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
        )}
        {getButtonText()}
      </button>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 backdrop-blur-sm">
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};

export default BatchSwapButton;
