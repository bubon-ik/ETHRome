/**
 * Вспомогательные утилиты для работы с 1inch Fusion SDK
 * 
 * Помогают подготавливать данные для batch swap через Fusion orders
 */

import { parseUnits } from 'viem';
import type { Address } from 'viem';
import type { SwapRoute } from '@/types';

/**
 * Подготовить данные для создания Fusion order из SwapRoute
 */
export function prepareFusionOrderParams(route: SwapRoute, walletAddress: string) {
  const amount = parseUnits(route.from.amount, route.from.decimals).toString();

  return {
    fromTokenAddress: route.from.address,
    toTokenAddress: route.to.address,
    amount,
    walletAddress,
  };
}

/**
 * Проверить, нужен ли approve для токена
 * ETH (нативный токен) не требует approve
 */
export function needsApproval(tokenAddress: string): boolean {
  const ETH_ADDRESS = '0x0000000000000000000000000000000000000000';
  const WETH_ADDRESS = '0x4200000000000000000000000000000000000006'; // Base WETH
  
  return tokenAddress.toLowerCase() !== ETH_ADDRESS.toLowerCase();
}

/**
 * Получить адрес 1inch Router для approve
 */
export function getOneInchRouterAddress(chainId: number): Address {
  // 1inch Router v5 addresses
  const ROUTERS: Record<number, Address> = {
    1: '0x1111111254EEB25477B68fb85Ed929f73A960582', // Ethereum
    56: '0x1111111254EEB25477B68fb85Ed929f73A960582', // BSC
    137: '0x1111111254EEB25477B68fb85Ed929f73A960582', // Polygon
    42161: '0x1111111254EEB25477B68fb85Ed929f73A960582', // Arbitrum
    10: '0x1111111254EEB25477B68fb85Ed929f73A960582', // Optimism
    8453: '0x1111111254EEB25477B68fb85Ed929f73A960582', // Base
  };

  return ROUTERS[chainId] || ROUTERS[1]; // fallback to Ethereum
}

/**
 * Получить адрес Fusion Settlement контракта
 */
export function getFusionSettlementAddress(chainId: number): Address {
  // Fusion Settlement addresses (могут отличаться от Router)
  const SETTLEMENTS: Record<number, Address> = {
    1: '0x1111111254EEB25477B68fb85Ed929f73A960582', // Ethereum
    56: '0x1111111254EEB25477B68fb85Ed929f73A960582', // BSC
    137: '0x1111111254EEB25477B68fb85Ed929f73A960582', // Polygon
    42161: '0x1111111254EEB25477B68fb85Ed929f73A960582', // Arbitrum
    10: '0x1111111254EEB25477B68fb85Ed929f73A960582', // Optimism
    8453: '0x1111111254EEB25477B68fb85Ed929f73A960582', // Base
  };

  return SETTLEMENTS[chainId] || SETTLEMENTS[1];
}

/**
 * Создать calldata для approve токена
 */
export function createApproveCalldata(amount: bigint, spender: Address): `0x${string}` {
  // ERC20 approve(address spender, uint256 amount)
  // Function selector: 0x095ea7b3
  const selector = '0x095ea7b3';
  const paddedSpender = spender.slice(2).padStart(64, '0');
  const paddedAmount = amount.toString(16).padStart(64, '0');
  
  return `${selector}${paddedSpender}${paddedAmount}` as `0x${string}`;
}

/**
 * Проверить, является ли токен нативным (ETH)
 */
export function isNativeToken(tokenAddress: string): boolean {
  const ETH_ADDRESS = '0x0000000000000000000000000000000000000000';
  return tokenAddress.toLowerCase() === ETH_ADDRESS.toLowerCase();
}

/**
 * Форматировать сумму для отображения
 */
export function formatAmount(amount: string, decimals: number, maxDecimals: number = 6): string {
  try {
    const value = parseFloat(amount) / Math.pow(10, decimals);
    return value.toFixed(Math.min(decimals, maxDecimals));
  } catch {
    return '0';
  }
}

/**
 * Рассчитать минимальную сумму с учетом slippage
 */
export function calculateMinAmount(amount: string, slippagePercent: number): string {
  const amountBigInt = BigInt(amount);
  const slippageBasis = BigInt(Math.floor((100 - slippagePercent) * 100));
  return ((amountBigInt * slippageBasis) / BigInt(10000)).toString();
}

/**
 * Валидация параметров swap
 */
export function validateSwapParams(route: SwapRoute): {
  valid: boolean;
  error?: string;
} {
  if (!route.from.amount || parseFloat(route.from.amount) <= 0) {
    return { valid: false, error: 'Invalid amount' };
  }

  if (route.from.address === route.to.address) {
    return { valid: false, error: 'Cannot swap same token' };
  }

  if (!route.from.address || !route.to.address) {
    return { valid: false, error: 'Invalid token addresses' };
  }

  return { valid: true };
}

/**
 * Преобразовать статус Fusion order в человекочитаемый текст
 */
export function formatOrderStatus(status: number | string): string {
  const statusMap: Record<string, string> = {
    '0': 'Invalid',
    '1': 'Pending',
    '2': 'Filled',
    '3': 'Cancelled',
    '4': 'Expired',
  };

  return statusMap[status.toString()] || 'Unknown';
}

/**
 * Генерация уникального ID для batch swap
 */
export function generateBatchId(): string {
  return `batch_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

