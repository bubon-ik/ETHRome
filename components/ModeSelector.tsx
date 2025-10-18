/**
 * Компонент для переключения между Fusion (gasless) и Standard режимами
 */

import React from 'react';
import type { SwapMode } from '@/hooks/useBatchSwap';

interface ModeSelectorProps {
  mode: SwapMode;
  onChange: (mode: SwapMode) => void;
  disabled?: boolean;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ mode, onChange, disabled = false }) => {
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Swap Mode</h3>
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${mode === 'fusion' ? 'bg-green-500' : 'bg-blue-500'}`} />
          <span className="text-xs font-medium text-gray-600">
            {mode === 'fusion' ? 'Gasless' : 'Standard'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Fusion Mode */}
        <button
          onClick={() => onChange('fusion')}
          disabled={disabled}
          className={`
            relative p-3 rounded-lg border-2 transition-all duration-200
            ${mode === 'fusion' 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-200 bg-white hover:border-gray-300'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <div className="text-left">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">⚡</span>
              <span className={`text-sm font-semibold ${mode === 'fusion' ? 'text-green-900' : 'text-gray-700'}`}>
                Fusion
              </span>
            </div>
            <div className={`text-xs ${mode === 'fusion' ? 'text-green-700' : 'text-gray-500'}`}>
              No gas fees
            </div>
            <div className={`text-xs ${mode === 'fusion' ? 'text-green-600' : 'text-gray-400'}`}>
              ~0.5-1% resolver fee
            </div>
          </div>
          {mode === 'fusion' && (
            <div className="absolute top-2 right-2">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          )}
        </button>

        {/* Standard Mode */}
        <button
          onClick={() => onChange('standard')}
          disabled={disabled}
          className={`
            relative p-3 rounded-lg border-2 transition-all duration-200
            ${mode === 'standard' 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 bg-white hover:border-gray-300'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <div className="text-left">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🔧</span>
              <span className={`text-sm font-semibold ${mode === 'standard' ? 'text-blue-900' : 'text-gray-700'}`}>
                Standard
              </span>
            </div>
            <div className={`text-xs ${mode === 'standard' ? 'text-blue-700' : 'text-gray-500'}`}>
              Pay gas fees
            </div>
            <div className={`text-xs ${mode === 'standard' ? 'text-blue-600' : 'text-gray-400'}`}>
              Instant execution
            </div>
          </div>
          {mode === 'standard' && (
            <div className="absolute top-2 right-2">
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          )}
        </button>
      </div>

      {/* Mode Description */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        {mode === 'fusion' ? (
          <div className="flex items-start gap-2">
            <span className="text-green-500 text-sm">ℹ️</span>
            <p className="text-xs text-gray-600">
              Fusion creates off-chain orders executed by resolvers. No gas fees, but small commission (~0.5-1%) 
              from swap amount. Execution may take 10-60 seconds.
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-2">
            <span className="text-blue-500 text-sm">ℹ️</span>
            <p className="text-xs text-gray-600">
              Standard mode uses EIP-5792 sendCalls for batch transactions. You pay gas fees, 
              but execution is instant and guaranteed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModeSelector;

