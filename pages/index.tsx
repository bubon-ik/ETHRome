import React, { useState } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { 
  ArrowsRightLeftIcon, 
  ClockIcon, 
  ChartBarIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import SwapInterface from '@/components/SwapInterface';
import LimitOrdersPanel from '@/components/LimitOrdersPanel';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'swap' | 'orders' | 'analytics'>('swap');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const tabs = [
    { id: 'swap', label: 'Swap', icon: ArrowsRightLeftIcon },
    { id: 'orders', label: 'Limit Orders', icon: ClockIcon },
    { id: 'analytics', label: 'Analytics', icon: ChartBarIcon },
  ] as const;

  return (
    <>
      <Head>
        <title>Multi-Token Swap - ETHRome Hackathon</title>
        <meta name="description" content="Swap multiple tokens in a single transaction with limit orders" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Navigation */}
        <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <ArrowsRightLeftIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">MultiSwap</h1>
                  <p className="text-xs text-gray-500">ETHRome Hackathon</p>
                </div>
              </motion.div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-8">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <motion.button
                      key={tab.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                        activeTab === tab.id
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {tab.label}
                    </motion.button>
                  );
                })}
              </div>

              {/* Connect Button */}
              <div className="flex items-center gap-4">
                <ConnectButton />
                
                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden p-2 text-gray-600 hover:text-gray-900"
                >
                  {isMobileMenuOpen ? (
                    <XMarkIcon className="w-6 h-6" />
                  ) : (
                    <Bars3Icon className="w-6 h-6" />
                  )}
                </button>
              </div>
            </div>

            {/* Mobile Navigation */}
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden py-4 border-t border-gray-200"
              >
                <div className="flex flex-col gap-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all text-left ${
                          activeTab === tab.id
                            ? 'bg-primary-100 text-primary-700'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Swap Multiple Tokens
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600">
                In One Transaction
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the future of DeFi with batch swaps and limit orders on Base mainnet. 
              Save on gas fees and time with our innovative multi-token swap protocol.
            </p>
          </motion.div>

          {/* Content Sections */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'swap' && <SwapInterface />}
            {activeTab === 'orders' && <LimitOrdersPanel />}
            {activeTab === 'analytics' && (
              <div className="card text-center py-12">
                <ChartBarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics Coming Soon</h3>
                <p className="text-gray-500">Track your trading performance and portfolio analytics</p>
              </div>
            )}
          </motion.div>

          {/* Features Section */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ArrowsRightLeftIcon className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Batch Swaps</h3>
              <p className="text-gray-600">
                Execute multiple token swaps in a single transaction using EIP-5792 sendCalls
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ClockIcon className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Limit Orders</h3>
              <p className="text-gray-600">
                Set price targets and execute trades automatically with 1inch limit orders
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ChartBarIcon className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Base Optimized</h3>
              <p className="text-gray-600">
                Built specifically for Base mainnet with low fees and fast transactions
              </p>
            </div>
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="mt-16 bg-white/50 backdrop-blur-xl border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center text-gray-600">
              <p>Built for ETHRome Hackathon 2025</p>
              <p className="text-sm mt-2">Powered by Scaffold-ETH, Base, 1inch, and Wagmi</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
