import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { parseUnits } from 'viem';
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
      setFusionStatus('loading');
      
      try {
        // Проверяем статус Fusion SDK
        const features = fusionService.getFeatures();
        if (features.demoMode) {
          setFusionStatus('demo');
          console.log('🎭 Demo mode active - using simulated quotes');
        } else {
          setFusionStatus('working');
        }
        
        const quotePromises = routes.map(async (route) => {
          if (!route.from.amount || parseFloat(route.from.amount) === 0) return null;
          
          const amount = parseUnits(route.from.amount, route.from.decimals).toString();
          
          try {
            // Используем Fusion SDK для котировок
            const quote = await fusionService.getFusionQuote({
              fromTokenAddress: route.from.address,
              toTokenAddress: route.to.address,
              amount,
              walletAddress: address || '0x0000000000000000000000000000000000000000',
            });
            
            // Если получили котировку, значит SDK работает
            if (quote && !features.demoMode) {
              setFusionStatus('working');
            }
            
            return quote;
          } catch (error) {
            console.error('Quote error for route:', route, error);
            setFusionStatus('error');
            // Возвращаем null для этого route, но не ломаем весь процесс
            return null;
          }
        });

        const routeQuotes = await Promise.all(quotePromises);
        const validQuotes = routeQuotes.filter(Boolean);
        setQuotes(validQuotes);
        
        // В Fusion режиме gas = 0 (gasless)
        if (mode === 'fusion') {
          setTotalGas('0 (Gasless ⚡)');
        } else {
          // Calculate total gas для standard режима
          const gas = validQuotes.reduce((acc, quote) => acc + parseInt(quote?.gas || '0'), 0);
          setTotalGas((gas / 1e9).toFixed(2)); // Convert to GWEI
        }
      } catch (err) {
        console.error('Failed to get quotes:', err);
        setQuotes([]);
        setTotalGas('0');
      } finally {
        setIsGettingQuotes(false);
      }
    };

    getQuotes();
  }, [routes, address, mode]);

  const handleSwap = async () => {
    if (!address) return;

    const validRoutes = routes.filter(
      route => route.from.amount && parseFloat(route.from.amount) > 0
    );

    if (validRoutes.length === 0) return;

    await executeBatchSwap({
      routes: validRoutes,
      recipient: address,
      deadline: Date.now() + deadline * 60 * 1000,
      slippage,
      mode, // Передаем выбранный режим (fusion или standard)
    });
  };

  const isDisabled = !mounted || !address || 
    !routes.some(route => route.from.amount && parseFloat(route.from.amount) > 0) ||
    isLoading ||
    isGettingQuotes;

  const getButtonText = () => {
    // Избегаем hydration mismatch
    if (!mounted) return 'Loading...';
    if (!address) return 'Connect Wallet';
    if (isGettingQuotes) return 'Getting Quotes...';
    if (isLoading) {
      return mode === 'fusion' 
        ? 'Creating Fusion Orders... ⚡' 
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
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              <div>
                <div className="text-sm font-semibold text-blue-900">Gasless Mode (Fusion)</div>
                <div className="text-xs text-blue-700">
                  {fusionStatus === 'loading' && '🔄 Checking Fusion SDK...'}
                  {fusionStatus === 'working' && '✅ Fusion SDK active - Real gasless swaps!'}
                  {fusionStatus === 'demo' && '📝 Demo mode - Simulated gasless swaps'}
                  {fusionStatus === 'error' && '⚠️ Fallback mode - Using demo quotes'}
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowFusionInfo(!showFusionInfo)}
              className="text-blue-600 hover:text-blue-800 text-xs underline"
            >
              {showFusionInfo ? 'Hide' : 'Info'}
            </button>
          </div>
          {showFusionInfo && (
            <div className="mt-2 text-xs text-blue-800 border-t border-blue-200 pt-2">
              {fusionStatus === 'working' && 'Fusion SDK работает! Создаются реальные off-chain orders которые выполняются resolvers.'}
              {fusionStatus === 'demo' && 'Fusion SDK в demo режиме. Показываются симулированные котировки и orders.'}
              {fusionStatus === 'error' && 'Fusion SDK недоступен. Используется fallback режим с demo котировками.'}
            </div>
          )}
        </div>
      )}

      {/* Swap Summary */}
      {quotes.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            {mode === 'fusion' ? 'Fusion Orders Preview' : 'Swap Summary'}
          </h3>
          <div className="space-y-2">
            {quotes.map((quote, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span className="text-gray-600">
                  {quote.fromToken.symbol} → {quote.toToken.symbol}
                </span>
                <span className="font-medium">
                  {formatAmount(quote.toAmount, quote.toToken.decimals)} {quote.toToken.symbol}
                </span>
              </div>
            ))}
            <div className="pt-2 border-t border-gray-200">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">
                  {mode === 'fusion' ? 'Gas Fee' : 'Total Gas (est.)'}
                </span>
                <span className="font-medium">
                  {typeof totalGas === 'string' ? totalGas : `${totalGas} GWEI`}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fusion Orders Status */}
      {fusionOrders.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-green-900 mb-2">
            ✅ Fusion Orders Created ({fusionOrders.length})
          </h3>
          <div className="space-y-2">
            {fusionOrders.map((order, index) => (
              <div key={index} className="text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">
                    {order.route.from.symbol} → {order.route.to.symbol}
                  </span>
                  <span className="text-green-700 font-mono">
                    {order.order.orderHash.substring(0, 10)}...
                  </span>
                </div>
              </div>
            ))}
          </div>
          {batchId && (
            <div className="mt-2 pt-2 border-t border-green-200">
              <div className="text-xs text-gray-600">
                Batch ID: <span className="font-mono">{batchId}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Success Display */}
      {isSuccess && txHash && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-green-700 text-sm font-semibold mb-1">
            {mode === 'fusion' ? '⚡ Fusion Orders Submitted!' : '✅ Batch Swap Successful!'}
          </p>
          <p className="text-green-600 text-xs">
            {mode === 'fusion' ? (
              <>
                Your orders are being processed by resolvers. This may take a few moments.
                <br />
                <span className="font-mono text-xs mt-1 block">Order: {txHash.substring(0, 20)}...</span>
              </>
            ) : (
              <>
                Transaction confirmed! 
                <a
                  href={`https://basescan.org/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 underline hover:no-underline"
                >
                  View on BaseScan
                </a>
              </>
            )}
          </p>
        </div>
      )}

      {/* Swap Button */}
      <button
        onClick={handleSwap}
        disabled={isDisabled}
        className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 ${
          isDisabled
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'btn-primary hover:shadow-xl'
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

export default BatchSwapButton;
