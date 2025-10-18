'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ClockIcon } from '@heroicons/react/24/outline';
import BatchLimitOrderInterface from './BatchLimitOrderInterface';

const LimitOrdersPanel: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <ClockIcon className="w-8 h-8 text-blue-400" />
          <h2 className="text-4xl font-bold gradient-text">Limit Orders</h2>
        </div>
        <p className="text-gray-600 dark:text-white/60 text-lg">
          Create multiple limit orders and let the market come to you
        </p>
      </motion.div>

      <BatchLimitOrderInterface />
    </div>
  );
};

export default LimitOrdersPanel;
