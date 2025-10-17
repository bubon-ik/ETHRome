import React, { useState } from 'react';
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { Token } from '@/types';
import { BASE_TOKENS } from '@/lib/wagmi';

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
        className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-all duration-200"
      >
        {selectedToken.logoURI && (
          <img
            src={selectedToken.logoURI}
            alt={selectedToken.symbol}
            className="w-6 h-6 rounded-full"
          />
        )}
        <span className="font-semibold text-gray-900 dark:text-white transition-colors duration-300">{selectedToken.symbol}</span>
        <ChevronDownIcon className="w-4 h-4 text-gray-500 dark:text-gray-400 transition-colors duration-300" />
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
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-semibold leading-6 text-gray-900 dark:text-white mb-4 transition-colors duration-300"
                  >
                    Select a Token
                  </Dialog.Title>

                  {/* Search Input */}
                  <div className="relative mb-4">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 transition-colors duration-300" />
                    <input
                      type="text"
                      placeholder="Search tokens..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300"
                    />
                  </div>

                  {/* Token List */}
                  <div className="max-h-80 overflow-y-auto space-y-2">
                    {filteredTokens.map((token) => (
                      <motion.button
                        key={token.address}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSelect(token)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                      >
                        {token.logoURI && (
                          <img
                            src={token.logoURI}
                            alt={token.symbol}
                            className="w-8 h-8 rounded-full"
                          />
                        )}
                        <div className="flex-1 text-left">
                          <div className="font-semibold text-gray-900 dark:text-white transition-colors duration-300">{token.symbol}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">{token.name}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-300">0.00</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">$0.00</div>
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  {filteredTokens.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400 transition-colors duration-300">
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



