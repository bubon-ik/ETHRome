/**
 * ⚠️ DEPRECATED: This component has been replaced with BatchSwapButton (Fusion mode only)
 * Simple Swap mode has been removed - only Fusion (gasless) swaps are supported
 */

import React from 'react';
import BatchSwapButton from './BatchSwapButton';

interface SimpleBatchSwapButtonProps {
  routes: any[];
  slippage: number;
  deadline: number;
}

/**
 * @deprecated Use BatchSwapButton with mode="fusion" instead
 */
const SimpleBatchSwapButton: React.FC<SimpleBatchSwapButtonProps> = ({
  routes,
  slippage,
  deadline,
}) => {
  // Redirect to BatchSwapButton with fusion mode only (hardcoded)
  return (
    <BatchSwapButton
      routes={routes}
      slippage={slippage}
      deadline={deadline}
    />
  );
};

export default SimpleBatchSwapButton;
