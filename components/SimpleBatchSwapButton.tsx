import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { parseUnits } from 'viem';
import { SwapRoute } from '@/types';
import { useSimpleBatchSwap } from '@/hooks/useSimpleBatchSwap';
import { simpleSwapService } from '@/lib/simple-swap';

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

  // Избегаем hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get quotes for all routes
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
          if (!route.from.amount || parseFloat(route.from.amount) === 0) return null;
          
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

    getQuotes();
  }, [routes, address, slippage]);

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
    });
  };

  const isDisabled = !mounted || !address || 
    !routes.some(route => route.from.amount && parseFloat(route.from.amount) > 0) ||
    isLoading ||
    isGettingQuotes;

  const getButtonText = () => {
    if (!mounted) return 'Loading...';
    if (!address) return 'Connect Wallet';
    if (isGettingQuotes) return 'Getting Quotes...';
    if (isLoading) return 'Executing Batch Swap...';
    if (!routes.some(route => route.from.amount && parseFloat(route.from.amount) > 0)) {
      return 'Enter Amount';
    }
    const count = routes.filter(r => r.from.amount && parseFloat(r.from.amount) > 0).length;
    return `Swap ${count} Token${count !== 1 ? 's' : ''}`;
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
            <div className="text-sm font-semibold text-blue-200">Simple Swap Mode</div>
            <div className="text-xs text-blue-100/90">
              Using 1inch API + wagmi sendCalls for batch swaps
            </div>
          </div>
        </div>
      </div>

      {/* Swap Summary */}
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

      {/* Error Display */}
      {error && (
        <div className="liquid-glass rounded-2xl p-4 bg-red-500/20 border border-red-400/30">
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      {/* Success Display */}
      {isSuccess && txHash && (
        <div className="liquid-glass rounded-2xl p-4 bg-green-500/20 border border-green-400/30">
          <p className="text-green-200 text-sm font-semibold mb-1">
            ✅ Batch Swap Successful!
          </p>
          <p className="text-green-100 text-xs">
            Transaction confirmed! 
            <a
              href={`https://basescan.org/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 underline hover:no-underline text-green-200"
            >
              View on BaseScan
            </a>
          </p>
          {batchId && (
            <p className="text-green-100 text-xs mt-1">
              Batch ID: <span className="font-mono text-green-200">{batchId}</span>
            </p>
          )}
        </div>
      )}

      {/* Swap Button */}
      <button
        onClick={handleSwap}
        disabled={isDisabled}
        className={`w-full py-4 px-6 font-semibold text-lg transition-all duration-300 ${
          isDisabled
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