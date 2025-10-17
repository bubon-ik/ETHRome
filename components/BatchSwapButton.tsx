import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { parseUnits } from 'viem';
import { SwapRoute } from '@/types';
import { useBatchSwap } from '@/hooks/useBatchSwap';
import { oneInchLimitOrderService } from '@/lib/1inch-limit-order';

interface BatchSwapButtonProps {
  routes: SwapRoute[];
  slippage: number;
  deadline: number;
}

const BatchSwapButton: React.FC<BatchSwapButtonProps> = ({
  routes,
  slippage,
  deadline,
}) => {
  const { address } = useAccount();
  const { executeBatchSwap, isLoading, error, txHash, isSuccess } = useBatchSwap();
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
          
          const amount = parseUnits(route.from.amount, route.from.decimals).toString();
          return await oneInchLimitOrderService.getQuote({
            src: route.from.address,
            dst: route.to.address,
            amount,
          });
        });

        const routeQuotes = await Promise.all(quotePromises);
        const validQuotes = routeQuotes.filter(Boolean);
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
  }, [routes]);

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
    // Избегаем hydration mismatch
    if (!mounted) return 'Loading...';
    if (!address) return 'Connect Wallet';
    if (isGettingQuotes) return 'Getting Quotes...';
    if (isLoading) return 'Executing Batch Swap...';
    if (!routes.some(route => route.from.amount && parseFloat(route.from.amount) > 0)) {
      return 'Enter Amount';
    }
    return `Swap ${routes.filter(r => r.from.amount && parseFloat(r.from.amount) > 0).length} Token${routes.filter(r => r.from.amount && parseFloat(r.from.amount) > 0).length !== 1 ? 's' : ''}`;
  };

  return (
    <div className="space-y-4">
      {/* Swap Summary */}
      {quotes.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Swap Summary</h3>
          <div className="space-y-2">
            {quotes.map((quote, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span className="text-gray-600">
                  {quote.fromToken.symbol} → {quote.toToken.symbol}
                </span>
                <span className="font-medium">
                  {(parseFloat(quote.toAmount) / Math.pow(10, quote.toToken.decimals)).toFixed(4)} {quote.toToken.symbol}
                </span>
              </div>
            ))}
            <div className="pt-2 border-t border-gray-200">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Total Gas (est.)</span>
                <span className="font-medium">{totalGas} GWEI</span>
              </div>
            </div>
          </div>
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
          <p className="text-green-700 text-sm">
            Batch swap successful! 
            <a
              href={`https://basescan.org/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 underline hover:no-underline"
            >
              View on BaseScan
            </a>
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
