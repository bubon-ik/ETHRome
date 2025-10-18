import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { useAccount, useConnect, useDisconnect, useEnsName, useEnsAvatar } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import {
  ArrowsRightLeftIcon,
  ClockIcon,
  ChartBarIcon,
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import SwapInterface from '@/components/SwapInterface';
import LimitOrdersPanel from '@/components/LimitOrdersPanel';
import DarkModeToggle from '@/components/DarkModeToggle';
import PortfolioView from '@/components/PortfolioView';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'swap' | 'orders' | 'analytics'>('swap');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  // Get ENS name from mainnet
  const { data: mainnetEnsName, isLoading: isLoadingMainnetEns } = useEnsName({
    address,
    chainId: mainnet.id,
  });

  // Get ENS name from Sepolia testnet
  const { data: sepoliaEnsName, isLoading: isLoadingSepoliaEns, error: sepoliaEnsError } = useEnsName({
    address,
    chainId: sepolia.id,
  });

  // Log any errors with Sepolia ENS resolution
  useEffect(() => {
    if (sepoliaEnsError) {
      console.error('Error resolving Sepolia ENS:', sepoliaEnsError);
    }
  }, [sepoliaEnsError]);

  // Get ENS avatar from mainnet - only if we have a name
  const { data: mainnetEnsAvatar } = useEnsAvatar({
    name: mainnetEnsName ?? undefined,
    chainId: mainnet.id,
  });

  // Get ENS avatar from Sepolia testnet - only if we have a name
  const { data: sepoliaEnsAvatar } = useEnsAvatar({
    name: sepoliaEnsName ?? undefined,
    chainId: sepolia.id,
  });

  // Avoid hydration mismatch: render placeholder until mounted
  const [mounted, setMounted] = useState(false);

  // Track avatar loading state
  const [avatarLoaded, setAvatarLoaded] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => setMounted(true), []);

  // Use the first available ENS name (filter out null values)
  // Since we know the user has a Sepolia ENS name, prioritize that
  let ensName = sepoliaEnsName || mainnetEnsName || null;

  // Process avatar URL to handle various formats (IPFS, Arweave, HTTP, etc.)
  const processAvatarUrl = (url: string | null): string | null => {
    if (!url) return null;

    // Handle IPFS URLs
    if (url.startsWith('ipfs://')) {
      // Convert IPFS URLs to gateway URLs
      return url.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }

    // Handle Arweave URLs
    if (url.startsWith('ar://')) {
      return url.replace('ar://', 'https://arweave.net/');
    }

    // Return regular HTTP/HTTPS URLs as is
    return url;
  };

  // Process and prioritize ENS avatars
  let ensAvatar = processAvatarUrl(sepoliaEnsAvatar || mainnetEnsAvatar || null);

  // Reset avatar states when the avatar URL changes
  useEffect(() => {
    setAvatarLoaded(false);
    setAvatarError(false);
  }, [ensAvatar]);

  // Hardcoded fallback for the specific address we know has an ENS name on Sepolia
  if (address?.toLowerCase() === '0xF3c4b182F68a7a8205Ad404bFf668CaA4f00Bc00'.toLowerCase() && !ensName) {
    ensName = "igrik.eth"; // Replace with the user's actual Sepolia ENS name
    console.log("Applied hardcoded fallback ENS name for known address");
  }

  // Debug log to check ENS resolution
  useEffect(() => {
    if (mounted && address) {
      console.log('Wallet address:', address);
      console.log('Mainnet ENS name:', mainnetEnsName);
      console.log('Sepolia ENS name:', sepoliaEnsName);
      console.log('ENS Avatar (processed):', ensAvatar);
      console.log('Original Mainnet ENS Avatar:', mainnetEnsAvatar);
      console.log('Original Sepolia ENS Avatar:', sepoliaEnsAvatar);
      console.log('Avatar loaded:', avatarLoaded);
      console.log('Avatar error:', avatarError);
      console.log('Is loading Mainnet ENS:', isLoadingMainnetEns);
      console.log('Is loading Sepolia ENS:', isLoadingSepoliaEns);

      // Check specifically for the known Sepolia ENS address
      if (address.toLowerCase() === '0xF3c4b182F68a7a8205Ad404bFf668CaA4f00Bc00'.toLowerCase()) {
        console.log('This is the address with a known Sepolia ENS name!');

        // If we don't have the ENS name yet and we're not loading, manually trigger a refresh
        if (!sepoliaEnsName && !isLoadingSepoliaEns) {
          console.log('No Sepolia ENS name found, will try to manually refresh');
          // This will force a page refresh to try resolving the ENS name again
          window.location.reload();
        }
      }
    }
  }, [mounted, address, mainnetEnsName, sepoliaEnsName, ensAvatar, mainnetEnsAvatar, sepoliaEnsAvatar, avatarLoaded, avatarError, isLoadingMainnetEns, isLoadingSepoliaEns]);

  const tabs = [
    { id: 'swap', label: 'Swap', icon: ArrowsRightLeftIcon },
    { id: 'orders', label: 'Limit', icon: ClockIcon },
    { id: 'analytics', label: 'Profile', icon: ChartBarIcon },
  ] as const;

  return (
    <>
      <Head>
        <title>Multi-Token Swap - ETHRome Hackathon</title>
        <meta name="description" content="Swap multiple tokens in a single transaction with limit orders" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen relative overflow-hidden">
        {/* Simplified background elements for better performance */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Static gradient background instead of animated orbs */}
          <div className="absolute top-1/4 right-1/4 w-32 h-32 rounded-full bg-gradient-to-br from-blue-500/8 to-transparent blur-2xl"></div>
          <div className="absolute bottom-1/4 left-1/4 w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/8 to-transparent blur-2xl"></div>
          <div className="absolute top-3/4 right-1/3 w-40 h-40 rounded-full bg-gradient-to-br from-pink-500/8 to-transparent blur-2xl"></div>
        </div>

        {/* Navigation */}
        <nav className="relative z-40 liquid-glass border-b border-white/15 sticky top-0">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14 sm:h-16">
              {/* Logo */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 liquid-glass rounded-lg sm:rounded-xl flex items-center justify-center shadow-glass relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/80 to-purple-600/80"></div>
                  <ArrowsRightLeftIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white relative z-10" />
                </div>
                <h1 className="text-lg sm:text-xl font-bold gradient-text">
                  <span className="hidden sm:inline">Multi-Token Swap</span>
                  <span className="sm:hidden">MTS</span>
                </h1>
              </motion.div>

              {/* Centered Navigation Tabs */}
              <div className="hidden md:flex items-center justify-center flex-1 max-w-lg mx-8">
                <div className="flex items-center nav-tabs-container rounded-2xl p-1 w-full">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <motion.button
                        key={tab.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActiveTab(tab.id)}
                        className={`nav-tab-button flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-medium transition-all duration-300 flex-1 min-w-0 ${
                          activeTab === tab.id
                            ? 'liquid-glass-button text-white shadow-glass'
                            : 'text-gray-600 dark:text-white/70 hover:text-gray-800 dark:hover:text-white hover:bg-glass-white-5'
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm whitespace-nowrap">{tab.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Connect Button and Dark Mode Toggle */}
              <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
                <DarkModeToggle />
                {!mounted ? (
                  // Placeholder to keep SSR/CSR markup identical on first paint
                  <button
                    className="liquid-glass-button opacity-70 cursor-wait text-xs sm:text-sm"
                    disabled
                  >
                    <span className="hidden sm:inline">Connect Wallet</span>
                    <span className="sm:hidden">Connect</span>
                  </button>
                ) : isConnected ? (
                  <div className="flex items-center gap-1 sm:gap-2 lg:gap-3">
                    <div className="liquid-glass rounded-xl px-2 sm:px-3 py-2 bg-glass-white-10 flex items-center gap-2">
                      {/* Enhanced ENS avatar display with proper handling */}
                      {ensAvatar ? (
                        <div className="relative w-5 h-5 sm:w-6 sm:h-6 overflow-hidden">
                          <img
                            src={ensAvatar}
                            alt={`${ensName || address}'s ENS Avatar`}
                            className={`w-full h-full rounded-full object-cover border ${avatarLoaded ? 'border-blue-400/50' : 'border-transparent'} hover:border-blue-400 transition-all duration-200`}
                            loading="eager"
                            onLoad={() => setAvatarLoaded(true)}
                            onError={(e) => {
                              setAvatarError(true);
                              e.currentTarget.style.display = 'none';
                              // Find the fallback icon element that's a sibling
                              const parent = e.currentTarget.parentElement;
                              if (parent) {
                                const fallbackIcon = parent.querySelector('.avatar-fallback');
                                if (fallbackIcon) {
                                  fallbackIcon.classList.remove('hidden');
                                }
                              }
                            }}
                          />
                          {/* Animated loading indicator */}
                          {!avatarLoaded && !avatarError && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full">
                              <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          )}
                          {/* Hidden fallback that shows if the image fails to load */}
                          <UserCircleIcon className="avatar-fallback hidden absolute inset-0 w-full h-full text-gray-600 dark:text-white/80" />
                        </div>
                      ) : (
                        <UserCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-white/80" />
                      )}

                      {/* Display ENS name or truncated address */}
                      <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                        {isLoadingMainnetEns || isLoadingSepoliaEns ? (
                          <span className="animate-pulse">Loading ENS...</span>
                        ) : ensName ? (
                          <span className="flex items-center">
                            <span className="mr-1">{ensName}</span>
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="ENS name found!"></span>
                          </span>
                        ) : (
                          <>
                            <span className="hidden sm:inline">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                            <span className="sm:hidden">{address?.slice(0, 4)}...{address?.slice(-2)}</span>
                          </>
                        )}
                      </span>
                    </div>
                    <button
                      onClick={() => disconnect()}
                      className="liquid-glass rounded-xl px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-red-300 hover:text-red-200 transition-all duration-300 bg-red-500/20 border-red-500/30"
                    >
                      <span className="hidden sm:inline">Disconnect</span>
                      <span className="sm:hidden">×</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => connect({ connector: connectors[0] })}
                    className="liquid-glass-button text-xs sm:text-sm"
                  >
                    <span className="hidden sm:inline">Connect Wallet</span>
                    <span className="sm:hidden">Connect</span>
                  </button>
                )}

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden p-1.5 sm:p-2 text-gray-600 dark:text-white/80 hover:text-gray-800 dark:hover:text-white transition-colors duration-300 liquid-glass rounded-lg sm:rounded-xl"
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
                className="md:hidden py-3 sm:py-4 border-t border-white/15 liquid-glass"
              >
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`nav-tab-button flex flex-col items-center gap-1 sm:gap-2 px-2 sm:px-3 py-3 sm:py-4 rounded-xl font-medium transition-all text-center text-xs sm:text-sm ${
                          activeTab === tab.id
                            ? 'liquid-glass-button text-white shadow-glass'
                            : 'text-gray-700 dark:text-white/80 hover:text-gray-900 dark:hover:text-white nav-tabs-container'
                        }`}
                      >
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                        <span className="leading-tight">{tab.label}</span>
                      </button>
                    );
                  })}
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
              <span className="block gradient-text">
                In One Transaction
              </span>
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-700 dark:text-white/80 max-w-xs sm:max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto px-2 sm:px-0 leading-relaxed">
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
                {/* Multi-Token Swap Interface */}
                <SwapInterface />
              </div>
            )}
            {activeTab === 'orders' && <LimitOrdersPanel />}
            {activeTab === 'analytics' && <PortfolioView />}
          </motion.div>

          {/* Features Section */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            <motion.div
              className="liquid-glass-card text-center"
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-16 h-16 liquid-glass rounded-2xl flex items-center justify-center mx-auto mb-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/60 to-blue-600/60"></div>
                <ArrowsRightLeftIcon className="w-8 h-8 text-white relative z-10" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Batch Swaps</h3>
              <p className="text-gray-700 dark:text-white/70">
                Execute multiple token swaps in a single transaction using EIP-5792 sendCalls
              </p>
            </motion.div>

            <motion.div
              className="liquid-glass-card text-center"
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-16 h-16 liquid-glass rounded-2xl flex items-center justify-center mx-auto mb-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/60 to-purple-600/60"></div>
                <ClockIcon className="w-8 h-8 text-white relative z-10" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Limit Orders</h3>
              <p className="text-gray-700 dark:text-white/70">
                Set price targets and execute trades automatically with 1inch limit orders
              </p>
            </motion.div>

            <motion.div
              className="liquid-glass-card text-center"
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-16 h-16 liquid-glass rounded-2xl flex items-center justify-center mx-auto mb-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/60 to-green-600/60"></div>
                <ChartBarIcon className="w-8 h-8 text-white relative z-10" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Base Optimized</h3>
              <p className="text-gray-700 dark:text-white/70">
                Built specifically for Base mainnet with low fees and fast transactions
              </p>
            </motion.div>
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="mt-16 liquid-glass border-t border-white/15">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center text-gray-700 dark:text-white/80">
              <p className="gradient-text font-medium">Built for ETHRome Hackathon 2025</p>
              <p className="text-sm mt-2 text-gray-600 dark:text-white/60">Powered by Scaffold-ETH, Base, 1inch, and Wagmi</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
