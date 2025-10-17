import React, { useState } from 'react';
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { Token } from '@/types';
import { BASE_TOKENS } from '@/lib/wagmi';
import { useTokenBalance } from '@/hooks/useTokenBalance';

interface TokenListItemProps {
  token: Token;
  onSelect: (token: Token) => void;
}

const TokenListItem: React.FC<TokenListItemProps> = ({ token, onSelect }) => {
  const balance = useTokenBalance(token);

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(token)}
      className="w-full flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg sm:rounded-xl hover:bg-white/20 dark:hover:bg-white/10 transition-all duration-200 backdrop-blur-sm"
    >
      {token.logoURI && (
        <img
          src={token.logoURI}
          alt={token.symbol}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full"
        />
      )}
      <div className="flex-1 text-left min-w-0">
        <div className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">{token.symbol}</div>
        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">{token.name}</div>
      </div>
      <div className="text-right">
        <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
          {balance.isLoading ? '...' : balance.formatted}
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400">$0.00</div>
      </div>
    </motion.button>
  );
};

interface TokenSelectorProps {
  selectedToken: Token;
  onSelect: (token: Token) => void;
}

const TokenSelector: React.FC<TokenSelectorProps> = ({ selectedToken, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTokens = BASE_TOKENS.filter(token =>
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (token: Token) => {
    onSelect(token);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 bg-white/30 dark:bg-black/30 hover:bg-white/40 dark:hover:bg-black/40 rounded-lg sm:rounded-xl transition-all duration-200 backdrop-blur-sm border border-white/40 dark:border-white/20"
      >
        {selectedToken.logoURI && (
          <img
            src={selectedToken.logoURI}
            alt={selectedToken.symbol}
            className="w-5 h-5 sm:w-6 sm:h-6 rounded-full"
          />
        )}
        <span className="font-semibold text-gray-900 dark:text-white transition-colors duration-300 text-sm sm:text-base">{selectedToken.symbol}</span>
        <ChevronDownIcon className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400 transition-colors duration-300" />
      </motion.button>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={setIsOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25 dark:bg-black/50 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-3 sm:p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-sm sm:max-w-md transform overflow-hidden rounded-xl lg:rounded-2xl bg-white/20 dark:bg-black/20 backdrop-blur-xl p-4 sm:p-6 text-left align-middle shadow-xl border border-white/30 dark:border-white/10">
                  <Dialog.Title
                    as="h3"
                    className="text-base sm:text-lg font-semibold leading-6 text-gray-900 dark:text-white mb-3 sm:mb-4"
                  >
                    Select a Token
                  </Dialog.Title>

                  {/* Search Input */}
                  <div className="relative mb-3 sm:mb-4">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search tokens..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-white/30 dark:border-white/20 bg-white/20 dark:bg-black/20 text-gray-900 dark:text-white rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm placeholder-gray-500 dark:placeholder-gray-400 text-sm sm:text-base"
                    />
                  </div>

                  {/* Token List */}
                  <div className="max-h-64 sm:max-h-80 overflow-y-auto space-y-1.5 sm:space-y-2">
                    {filteredTokens.map((token) => (
                      <TokenListItem
                        key={token.address}
                        token={token}
                        onSelect={handleSelect}
                      />
                    ))}
                  </div>

                  {filteredTokens.length === 0 && (
                    <div className="text-center py-6 sm:py-8 text-gray-500 dark:text-gray-400 transition-colors duration-300 text-sm sm:text-base">
                      No tokens found
                    </div>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

export default TokenSelector;



