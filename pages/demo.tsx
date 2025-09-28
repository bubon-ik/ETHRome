import React from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { 
  CheckIcon, 
  XMarkIcon,
  ClockIcon,
  ArrowsRightLeftIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

export default function Demo() {
  const features = [
    {
      title: 'Batch Swaps',
      description: 'Execute multiple token swaps in one transaction',
      available: true,
      details: 'Uses EIP-5792 sendCalls or fallback batching contract'
    },
    {
      title: 'Token Quotes',
      description: 'Get real-time prices from 1inch aggregator',
      available: true,
      details: 'Rate limited to 1 request/second without API key'
    },
    {
      title: 'Gas Optimization',
      description: 'Save gas fees by batching transactions',
      available: true,
      details: 'Significantly reduces transaction costs'
    },
    {
      title: 'Limit Orders',
      description: 'Set price targets for automatic execution',
      available: false,
      details: 'Requires 1inch API key from portal.1inch.dev'
    },
    {
      title: 'High Rate Limits',
      description: '100 requests per second',
      available: false,
      details: 'Free tier limited to 1 request/second'
    },
    {
      title: 'Advanced Analytics',
      description: 'Detailed transaction and performance data',
      available: false,
      details: 'Premium feature requiring API key'
    }
  ];

  return (
    <>
      <Head>
        <title>Demo - MultiSwap Features</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="max-w-4xl mx-auto px-4 py-16">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              MultiSwap Demo
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience batch swapping without API keys! See what works out of the box 
              and what requires a 1inch API key.
            </p>
          </motion.div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-6 rounded-2xl border-2 ${
                  feature.available
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-full ${
                    feature.available
                      ? 'bg-green-100'
                      : 'bg-gray-100'
                  }`}>
                    {feature.available ? (
                      <CheckIcon className="w-6 h-6 text-green-600" />
                    ) : (
                      <XMarkIcon className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-lg font-semibold mb-2 ${
                      feature.available ? 'text-green-900' : 'text-gray-700'
                    }`}>
                      {feature.title}
                    </h3>
                    <p className={`text-sm mb-3 ${
                      feature.available ? 'text-green-700' : 'text-gray-600'
                    }`}>
                      {feature.description}
                    </p>
                    <p className={`text-xs ${
                      feature.available ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {feature.details}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Demo Examples */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-2xl shadow-xl p-8 mb-12"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Try These Examples
            </h2>

            <div className="space-y-6">
              {/* Batch Swap Example */}
              <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center gap-3 mb-3">
                  <ArrowsRightLeftIcon className="w-6 h-6 text-green-600" />
                  <h3 className="font-semibold text-green-900">Batch Swap (Available)</h3>
                </div>
                <p className="text-green-700 text-sm mb-2">
                  Swap ETH → USDC and DAI → WETH in one transaction
                </p>
                <code className="text-xs bg-green-100 text-green-800 p-2 rounded block">
                  1. Add two swap routes<br/>
                  2. Set amounts<br/>
                  3. Click "Swap 2 Tokens"<br/>
                  4. Save on gas fees! 🎉
                </code>
              </div>

              {/* Limit Order Example */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <ClockIcon className="w-6 h-6 text-gray-400" />
                  <h3 className="font-semibold text-gray-700">Limit Orders (Requires API Key)</h3>
                </div>
                <p className="text-gray-600 text-sm mb-2">
                  Set ETH sell order when price reaches $4000
                </p>
                <code className="text-xs bg-gray-100 text-gray-600 p-2 rounded block">
                  1. Get API key from portal.1inch.dev<br/>
                  2. Add to .env.local<br/>
                  3. Create limit orders<br/>
                  4. Automatic execution when price target is hit
                </code>
              </div>
            </div>
          </motion.div>

          {/* Quick Setup */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-blue-50 rounded-2xl p-8 border border-blue-200"
          >
            <div className="flex items-center gap-3 mb-4">
              <CurrencyDollarIcon className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-blue-900">Quick Setup</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Immediate Start (No API Key)</h3>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>✅ Batch swaps work immediately</p>
                  <p>✅ Real-time price quotes</p>
                  <p>✅ Gas optimization</p>
                  <p>⚠️ Rate limited to 1 req/sec</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">With API Key</h3>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>🚀 100 requests per second</p>
                  <p>⏰ Limit orders functionality</p>
                  <p>📊 Advanced analytics</p>
                  <p>🔧 Premium features</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="text-center mt-12"
          >
            <a
              href="/"
              className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <ArrowsRightLeftIcon className="w-5 h-5" />
              Try Batch Swaps Now
            </a>
            <p className="text-sm text-gray-500 mt-3">
              No registration required • Works immediately
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
}
