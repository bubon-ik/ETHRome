import React from 'react';
import SwapInterface from '@/components/SwapInterface';

const TestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Simple Batch Swap Test
          </h1>
          <p className="text-gray-600">
            Testing wagmi sendCalls for batch swaps without Fusion SDK
          </p>
        </div>
        
        <SwapInterface />
        
        <div className="mt-8 bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            How it works:
          </h2>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-start gap-3">
              <span className="text-blue-600 font-bold">1.</span>
              <span>Uses 1inch API for quotes and swap data</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-blue-600 font-bold">2.</span>
              <span>Prepares batch calls with approve + swap transactions</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-blue-600 font-bold">3.</span>
              <span>Executes batch via wagmi sendCalls (EIP-5792)</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-blue-600 font-bold">4.</span>
              <span>Monitors batch execution status</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestPage;
