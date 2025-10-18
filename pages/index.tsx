import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { 
  ArrowsRightLeftIcon, 
  ClockIcon, 
  ChartBarIcon,
  Bars3Icon,
  XMarkIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import SwapInterface from '@/components/SwapInterface';
import SimpleSwapInterface from '@/components/SimpleSwapInterface';
import LimitOrdersPanel from '@/components/LimitOrdersPanel';
import DarkModeToggle from '@/components/DarkModeToggle';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'swap' | 'orders' | 'analytics'>('swap');
  const [swapMode, setSwapMode] = useState<'fusion' | 'simple'>('simple');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  // Avoid hydration mismatch: render placeholder until mounted
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const tabs = [
    { id: 'swap', label: 'Swap', icon: ArrowsRightLeftIcon },
    { id: 'orders', label: 'Limit Orders', icon: ClockIcon },
    { id: 'analytics', label: 'Analytics', icon: ChartBarIcon },
  ] as const;

  const handleTokenSearchClick = () => {
    window.open('/token-search-demo', '_blank');
  };

  return (
    <>
      <Head>
        <title>Multi-Token Swap - ETHRome Hackathon</title>
        <meta name="description" content="Swap multiple tokens in a single transaction with limit orders" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 sm:-top-40 sm:-right-40 w-40 h-40 sm:w-80 sm:h-80 bg-gradient-to-br from-blue-400/30 to-purple-600/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-20 -left-20 sm:-bottom-40 sm:-left-40 w-40 h-40 sm:w-80 sm:h-80 bg-gradient-to-br from-pink-400/30 to-blue-600/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 sm:w-96 sm:h-96 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        {/* Navigation */}
        <nav className="relative z-40 bg-white/10 dark:bg-black/10 backdrop-blur-xl border-b border-white/20 dark:border-white/10 sticky top-0">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14 sm:h-16">
              {/* Logo */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center space-x-2 sm:space-x-3"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                  <ArrowsRightLeftIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  <span className="hidden sm:inline">Multi-Token Swap</span>
                  <span className="sm:hidden">MTS</span>
                </h1>
              </motion.div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <motion.button
                      key={tab.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-3 lg:px-4 py-2 rounded-xl transition-all duration-300 flex items-center gap-2 text-sm ${
                        activeTab === tab.id
                          ? 'bg-white/20 dark:bg-white/10 text-blue-600 dark:text-blue-400 shadow-lg backdrop-blur-sm'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-white/10 dark:hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden lg:inline">{tab.label}</span>
                    </motion.button>
                  );
                })}
                
                {/* Token Search Demo Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleTokenSearchClick}
                  className="px-3 lg:px-4 py-2 rounded-xl transition-all duration-300 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-white/10 dark:hover:bg-white/5"
                  title="Token Search Demo"
                >
                  <MagnifyingGlassIcon className="w-4 h-4" />
                  <span className="hidden lg:inline">Token Search</span>
                </motion.button>
              </div>

              {/* Connect Button and Dark Mode Toggle */}
              <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
                <DarkModeToggle />
                {!mounted ? (
                  // Placeholder to keep SSR/CSR markup identical on first paint
                  <button
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 sm:px-4 py-2 rounded-xl font-medium opacity-70 cursor-wait backdrop-blur-sm text-xs sm:text-sm"
                    disabled
                  >
                    <span className="hidden sm:inline">Connect Wallet</span>
                    <span className="sm:hidden">Connect</span>
                  </button>
                ) : isConnected ? (
                  <div className="flex items-center gap-1 sm:gap-2 lg:gap-3">
                    <div className="bg-white/20 dark:bg-black/20 backdrop-blur-sm px-2 sm:px-3 py-2 rounded-xl border border-white/30 dark:border-white/20">
                      <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                        <span className="hidden sm:inline">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                        <span className="sm:hidden">{address?.slice(0, 4)}...{address?.slice(-2)}</span>
                      </span>
                    </div>
                    <button
                      onClick={() => disconnect()}
                      className="bg-red-500/20 backdrop-blur-sm text-red-700 dark:text-red-300 px-2 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-medium hover:bg-red-500/30 transition-all duration-300 border border-red-500/30"
                    >
                      <span className="hidden sm:inline">Disconnect</span>
                      <span className="sm:hidden">×</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => connect({ connector: connectors[0] })}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 sm:px-4 py-2 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg backdrop-blur-sm text-xs sm:text-sm"
                  >
                    <span className="hidden sm:inline">Connect Wallet</span>
                    <span className="sm:hidden">Connect</span>
                  </button>
                )}
                
                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden p-1.5 sm:p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-300 bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-lg sm:rounded-xl"
                >
                  {isMobileMenuOpen ? (
                    <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                  ) : (
                    <Bars3Icon className="w-5 h-5 sm:w-6 sm:h-6" />
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
                className="md:hidden py-3 sm:py-4 border-t border-white/20 dark:border-white/10 bg-white/10 dark:bg-black/10 backdrop-blur-xl"
              >
                <div className="flex flex-col gap-1 sm:gap-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-all text-left text-sm sm:text-base ${
                          activeTab === tab.id
                            ? 'bg-white/20 dark:bg-white/10 text-blue-600 dark:text-blue-400 backdrop-blur-sm shadow-lg'
                            : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/10 dark:hover:bg-white/5'
                        }`}
                      >
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                        {tab.label}
                      </button>
                    );
                  })}
                  
                  {/* Token Search Demo Button */}
                  <button
                    onClick={() => {
                      handleTokenSearchClick();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-all text-left text-sm sm:text-base text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/10 dark:hover:bg-white/5"
                  >
                    <MagnifyingGlassIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    Token Search Demo
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </nav>

        {/* Main Content */}
        <main className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-8 sm:mb-10 lg:mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 leading-tight">
              <span className="block mb-1 sm:mb-2">Swap Multiple Tokens</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
                In One Transaction
              </span>
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-700 dark:text-gray-300 max-w-xs sm:max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto px-2 sm:px-0 leading-relaxed">
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
            {activeTab === 'swap' && (
              <div className="space-y-6">
                {/* Swap Mode Selector */}
                <div className="flex justify-center">
                  <div className="bg-gray-100 rounded-xl p-1 flex">
                    <button
                      onClick={() => setSwapMode('simple')}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        swapMode === 'simple'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      🔄 Simple Swap
                    </button>
                    <button
                      onClick={() => setSwapMode('fusion')}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        swapMode === 'fusion'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      ⚡ Fusion (Gasless)
                    </button>
                  </div>
                </div>

                {/* Swap Interface */}
                {swapMode === 'simple' ? <SimpleSwapInterface /> : <SwapInterface />}
              </div>
            )}
            {activeTab === 'orders' && <LimitOrdersPanel />}
            {activeTab === 'analytics' && (
              <div className="card dark:bg-gray-800 dark:border-gray-700 text-center py-12 transition-colors duration-300">
                <ChartBarIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4 transition-colors duration-300" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-300">Analytics Coming Soon</h3>
                <p className="text-gray-500 dark:text-gray-400 transition-colors duration-300">Track your trading performance and portfolio analytics</p>
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
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors duration-300">
                <ArrowsRightLeftIcon className="w-8 h-8 text-primary-600 dark:text-primary-400 transition-colors duration-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-300">Batch Swaps</h3>
              <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">
                Execute multiple token swaps in a single transaction using EIP-5792 sendCalls
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors duration-300">
                <ClockIcon className="w-8 h-8 text-purple-600 dark:text-purple-400 transition-colors duration-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-300">Limit Orders</h3>
              <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">
                Set price targets and execute trades automatically with 1inch limit orders
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors duration-300">
                <ChartBarIcon className="w-8 h-8 text-green-600 dark:text-green-400 transition-colors duration-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-300">Base Optimized</h3>
              <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">
                Built specifically for Base mainnet with low fees and fast transactions
              </p>
            </div>
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="mt-16 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl border-t border-gray-200 dark:border-gray-700 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center text-gray-600 dark:text-gray-300 transition-colors duration-300">
              <p>Built for ETHRome Hackathon 2025</p>
              <p className="text-sm mt-2">Powered by Scaffold-ETH, Base, 1inch, and Wagmi</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
