# Batch Limit Orders Implementation

## Overview

This implementation adds batch limit order functionality to the ETHRome project, allowing users to create multiple limit orders in a single transaction using 1inch API and wagmi's `sendCalls`.

## Features

- ✅ **Batch Approvals**: Automatically handles token approvals for multiple limit orders
- ✅ **Single Transaction**: Uses wagmi `sendCalls` to execute approvals in one transaction
- ✅ **1inch Integration**: Leverages 1inch Limit Order SDK for order creation
- ✅ **Gas Optimization**: Reduces gas costs by batching approvals
- ✅ **User Experience**: Single click to create multiple limit orders

## Architecture

### Components

1. **`useBatchLimitOrder` Hook** (`/hooks/useBatchLimitOrder.ts`)
   - Main hook for batch limit order operations
   - Handles wallet connection and chain switching
   - Manages approval calls and order creation
   - Uses wagmi `sendCalls` for batch transactions

2. **`BatchLimitOrderService`** (`/lib/batch-limit-order-service.ts`)
   - Service class for batch limit order operations
   - Handles allowance checking and approval preparation
   - Creates limit orders using 1inch SDK
   - Manages order submission to 1inch API

3. **`BatchLimitOrderButton`** (`/components/BatchLimitOrderButton.tsx`)
   - React component for batch limit order UI
   - Shows order summary and progress
   - Handles success/error states
   - Provides user feedback

4. **Enhanced `LimitOrdersPanel`** (`/components/LimitOrdersPanel.tsx`)
   - Updated panel with batch mode support
   - Toggle between single and batch modes
   - Order management interface
   - Integration with batch functionality

## How It Works

### 1. Batch Approval Process

```typescript
// Collect all required approvals
const tokenApprovals = new Map<string, bigint>();
for (const order of params.orders) {
  const makerAsset = normalizeTokenAddress(order.tokenIn);
  if (makerAsset !== WETH_BASE) {
    const amount = parseUnits(order.amountIn, order.decimalsIn);
    const currentMax = tokenApprovals.get(makerAsset) || BigInt(0);
    if (amount > currentMax) {
      tokenApprovals.set(makerAsset, amount);
    }
  }
}

// Check allowances and prepare approve calls
for (const [tokenAddress, amount] of tokenApprovals.entries()) {
  const hasAllowance = await checkAllowance(tokenAddress, walletAddress, amount);
  if (!hasAllowance) {
    calls.push(createApproveCall(tokenAddress, amount));
  }
}
```

### 2. Batch Transaction Execution

```typescript
// Execute approve calls using wagmi sendCalls
if (calls.length > 0) {
  const result = await sendCalls(config, {
    calls,
    account: address,
  });
  setTxHash(result.id);
}
```

### 3. Limit Order Creation

```typescript
// Create signatures for all orders
const signatures: string[] = [];
for (const order of orders) {
  const typedData = order.getTypedData(CHAIN_ID);
  const signature = await signTypedData(config, {
    account: address,
    types: typedData.types,
    primaryType: typedData.primaryType,
    domain: typedData.domain,
    message: typedData.message,
  });
  signatures.push(signature);
}

// Submit all orders to 1inch API
await batchLimitOrderService.submitBatchLimitOrders(orders, signatures);
```

## Usage Examples

### Basic Usage

```typescript
import { useBatchLimitOrder } from '@/hooks/useBatchLimitOrder';

const MyComponent = () => {
  const { executeBatchLimitOrder, isLoading, error } = useBatchLimitOrder();

  const handleBatchOrder = async () => {
    await executeBatchLimitOrder({
      orders: [
        {
          tokenIn: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
          tokenOut: '0x0000000000000000000000000000000000000000', // ETH
          amountIn: '100',
          amountOut: '0.033',
          decimalsIn: 6,
          decimalsOut: 18,
        },
        {
          tokenIn: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
          tokenOut: '0x4200000000000000000000000000000000000006', // WETH
          amountIn: '200',
          amountOut: '0.066',
          decimalsIn: 6,
          decimalsOut: 18,
        },
      ],
    });
  };

  return (
    <button onClick={handleBatchOrder} disabled={isLoading}>
      {isLoading ? 'Creating...' : 'Create Batch Limit Orders'}
    </button>
  );
};
```

### Using the Component

```typescript
import BatchLimitOrderButton from '@/components/BatchLimitOrderButton';

const MyComponent = () => {
  const orders = [
    {
      tokenIn: { address: '0x...', symbol: 'USDC', decimals: 6 },
      tokenOut: { address: '0x...', symbol: 'ETH', decimals: 18 },
      amountIn: '100',
      amountOut: '0.033',
    },
    // ... more orders
  ];

  return (
    <BatchLimitOrderButton
      orders={orders}
      onSuccess={(orderHashes) => console.log('Success:', orderHashes)}
      onError={(error) => console.error('Error:', error)}
    />
  );
};
```

## Configuration

### Environment Variables

```bash
NEXT_PUBLIC_ONEINCH_API_KEY=your_1inch_api_key_here
```

### Chain Configuration

The implementation is configured for Base mainnet (Chain ID: 8453):

```typescript
const CHAIN_ID = 8453;
const LIMIT_ORDER_CONTRACT = '0x111111125421cA6dc452d289314280a0f8842A65';
const WETH_BASE = '0x4200000000000000000000000000000000000006';
```

## Error Handling

The implementation includes comprehensive error handling:

- **User Rejection**: Friendly messages for cancelled transactions
- **Network Issues**: Automatic retry and fallback mechanisms
- **API Errors**: Detailed error messages from 1inch API
- **Validation**: Input validation and amount checking

## Gas Optimization

### Benefits

1. **Reduced Gas Costs**: Batch approvals reduce total gas consumption
2. **Single Transaction**: Multiple approvals in one transaction
3. **Smart Allowance Management**: Only approves what's needed
4. **ETH/WETH Optimization**: Skips unnecessary approvals for native tokens

### Gas Estimation

- **Single Approval**: ~50,000 gas
- **Batch Approvals**: ~50,000 gas per token (shared transaction overhead)
- **Limit Order Creation**: API call (no gas cost)

## Testing

### Demo Mode

When no API key is provided, the service runs in demo mode:

```typescript
// Demo mode features
- Mock order creation
- Simulated API responses
- No actual blockchain transactions
- Development-friendly error messages
```

### Production Mode

With a valid API key:

```typescript
// Production features
- Real 1inch API integration
- Actual limit order creation
- Live orderbook submission
- Real-time order tracking
```

## Dependencies

- `@wagmi/core`: For `sendCalls` and wallet integration
- `@1inch/limit-order-sdk`: For 1inch limit order functionality
- `viem`: For blockchain interactions and encoding
- `react`: For UI components and hooks

## Future Enhancements

1. **Order Management**: View and cancel existing limit orders
2. **Partial Fills**: Support for partial order execution
3. **Advanced Features**: Stop-loss orders, trailing stops
4. **Multi-Chain**: Support for additional networks
5. **Analytics**: Order performance tracking and analytics

## Troubleshooting

### Common Issues

1. **API Key Required**: Ensure `NEXT_PUBLIC_ONEINCH_API_KEY` is set
2. **Network Mismatch**: Switch to Base network in wallet
3. **Insufficient Allowance**: Check token approvals
4. **Order Validation**: Verify amounts and token addresses

### Debug Mode

Enable debug logging:

```typescript
// Add to your component
console.log('Batch order service features:', batchLimitOrderService.getFeatures());
```

## Support

For issues or questions:

1. Check the console for detailed error messages
2. Verify API key configuration
3. Ensure wallet is connected to Base network
4. Review order parameters and amounts

