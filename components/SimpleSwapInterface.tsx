import React, { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';

const SimpleSwapInterface: React.FC = () => {
  const [routes, setRoutes] = useState([{ id: 1 }]);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Multi-Token Swap</h1>
        
        {/* Test Route */}
        <div className="space-y-4 mb-6">
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-4">Swap #1</h3>
            
            {/* From Token */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 mb-3">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600">From</span>
                <span className="text-xs text-gray-400">Balance: 0.00</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-xl">
                  <span className="font-semibold">ETH</span>
                </div>
                <input 
                  type="text" 
                  placeholder="0.0"
                  className="flex-1 bg-transparent text-right text-lg font-semibold outline-none"
                />
              </div>
            </div>

            {/* Swap Arrow */}
            <div className="flex justify-center mb-3">
              <button className="p-2 bg-white border-2 border-gray-200 rounded-full">
                ↕️
              </button>
            </div>

            {/* To Token */}
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600">To</span>
                <span className="text-xs text-gray-400">Balance: 0.00</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-xl">
                  <span className="font-semibold">USDC</span>
                </div>
                <input 
                  type="text" 
                  placeholder="0.0"
                  className="flex-1 bg-transparent text-right text-lg font-semibold outline-none"
                  readOnly
                />
              </div>
            </div>
          </div>
        </div>

        {/* Add Route Button */}
        <button 
          className="w-full flex items-center justify-center gap-2 py-3 px-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors mb-6"
        >
          <PlusIcon className="w-5 h-5" />
          Add Another Swap
        </button>

        {/* Swap Button */}
        <button className="w-full py-4 px-6 rounded-xl font-semibold text-lg bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200">
          Connect Wallet
        </button>
      </div>
    </div>
  );
};

export default SimpleSwapInterface;



