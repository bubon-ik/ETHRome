/**
 * Simple Swap Service - без Fusion SDK
 * Использует обычный 1inch API + wagmi sendCalls для batch свапов
 * 
 * @see https://wagmi.sh/core/api/actions/sendCalls
 */

import { SwapQuote, Token } from '@/types';
import { parseUnits, encodeFunctionData, erc20Abi, type Address } from 'viem';

const ONEINCH_API_URL = '/api/1inch';
const BASE_CHAIN_ID = 8453; // Base mainnet
const ONEINCH_ROUTER = '0x1111111254EEB25477B68fb85Ed929f73A960582'; // 1inch router на Base

// ETH address constants
const ETH_ADDRESS = '0x0000000000000000000000000000000000000000';
const ETH_ADDRESS_1INCH = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

export interface SwapParams {
  fromToken: Token;
  toToken: Token;
  amount: string;
  walletAddress: string;
  slippage?: number;
  permit?: string; // Permit данные для экономии газа
}

export interface SwapTransaction {
  to: Address;
  data: `0x${string}`;
  value: bigint;
  gas?: string;
  gasPrice?: string;
}

export interface BatchSwapCall {
  to: Address;
  data: `0x${string}`;
  value: bigint;
}

export class SimpleSwapService {
  private apiKey: string;
  private isDemoMode: boolean;

  constructor(apiKey: string = process.env.NEXT_PUBLIC_ONEINCH_API_KEY || '') {
    this.apiKey = apiKey;
    this.isDemoMode = !apiKey || apiKey === 'your_1inch_api_key';
    
    console.log('🔑 SimpleSwapService initialized:');
    console.log('  API Key:', apiKey ? `${apiKey.substring(0, 8)}...` : 'NOT SET');
    console.log('  Demo Mode:', this.isDemoMode);
  }

  /**
   * Нормализовать адрес токена для 1inch API
   */
  private normalizeTokenAddress(address: string): string {
    if (address.toLowerCase() === ETH_ADDRESS.toLowerCase()) {
      return ETH_ADDRESS_1INCH;
    }
    return address;
  }

  /**
   * Получить котировку для свапа
   */
  async getQuote(params: SwapParams): Promise<SwapQuote> {
    if (this.isDemoMode) {
      return this.getDemoQuote(params);
    }

    // Проверяем, что мы в браузере
    if (typeof window === 'undefined') {
      console.log('🌐 SSR mode, using demo quote');
      return this.getDemoQuote(params);
    }

    try {
      const url = new URL(`${ONEINCH_API_URL}/swap/v5.0/${BASE_CHAIN_ID}/quote`, window.location.origin);
      url.searchParams.append('src', this.normalizeTokenAddress(params.fromToken.address));
      url.searchParams.append('dst', this.normalizeTokenAddress(params.toToken.address));
      url.searchParams.append('amount', parseUnits(params.amount, params.fromToken.decimals).toString());

      console.log('🔍 Getting quote from:', url.toString());

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', response.status, errorText);
        throw new Error(`1inch API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Quote received:', data);
      
      // 1inch API возвращает данные в другом формате
      return {
        fromToken: {
          address: params.fromToken.address,
          symbol: data.fromToken?.symbol || params.fromToken.symbol,
          name: data.fromToken?.name || params.fromToken.name,
          decimals: data.fromToken?.decimals || params.fromToken.decimals,
          chainId: BASE_CHAIN_ID,
        },
        toToken: {
          address: params.toToken.address,
          symbol: data.toToken?.symbol || params.toToken.symbol,
          name: data.toToken?.name || params.toToken.name,
          decimals: data.toToken?.decimals || params.toToken.decimals,
          chainId: BASE_CHAIN_ID,
        },
        fromAmount: data.fromTokenAmount || params.amount,
        toAmount: data.toTokenAmount || '0',
        gas: data.estimatedGas || '150000',
        gasPrice: '2000000000',
        protocols: data.protocols || [],
      };
    } catch (error) {
      console.error('Failed to get quote:', error);
      return this.getDemoQuote(params);
    }
  }

  /**
   * Получить данные транзакции для свапа
   */
  async getSwapTransaction(params: SwapParams & { slippage?: number }): Promise<SwapTransaction> {
    if (this.isDemoMode) {
      return this.getDemoSwapTransaction(params);
    }

    try {
      const url = new URL(`${ONEINCH_API_URL}/swap/v5.0/${BASE_CHAIN_ID}/swap`, window.location.origin);
      url.searchParams.append('src', this.normalizeTokenAddress(params.fromToken.address));
      url.searchParams.append('dst', this.normalizeTokenAddress(params.toToken.address));
      url.searchParams.append('amount', parseUnits(params.amount, params.fromToken.decimals).toString());
      url.searchParams.append('from', params.walletAddress);
      url.searchParams.append('slippage', (params.slippage || 1).toString());
      
      // Добавляем permit данные если есть
      if (params.permit) {
        url.searchParams.append('permit', params.permit);
        console.log('🔐 Using permit data for gas optimization');
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`1inch API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        to: data.tx.to as Address,
        data: data.tx.data as `0x${string}`,
        value: BigInt(data.tx.value || '0'),
        gas: data.tx.gas,
        gasPrice: data.tx.gasPrice,
      };
    } catch (error) {
      console.error('Failed to get swap transaction:', error);
      return this.getDemoSwapTransaction(params);
    }
  }

  /**
   * Получить данные для approve транзакции
   */
  async getApproveTransaction(
    tokenAddress: string, 
    amount: string,
    decimals: number = 18
  ): Promise<SwapTransaction> {
    if (this.isDemoMode) {
      return this.getDemoApproveTransaction(tokenAddress, amount);
    }

    try {
      const url = new URL(`${ONEINCH_API_URL}/swap/v5.2/${BASE_CHAIN_ID}/approve/transaction`, window.location.origin);
      url.searchParams.append('tokenAddress', tokenAddress);
      url.searchParams.append('amount', parseUnits(amount, decimals).toString());

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`1inch API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        to: data.to as Address,
        data: data.data as `0x${string}`,
        value: BigInt(data.value || '0'),
        gas: data.gas,
        gasPrice: data.gasPrice,
      };
    } catch (error) {
      console.error('Failed to get approve transaction:', error);
      return this.getDemoApproveTransaction(tokenAddress, amount);
    }
  }

  /**
   * Проверить allowance для токена
   */
  async getAllowance(tokenAddress: string, walletAddress: string): Promise<string> {
    if (this.isDemoMode) {
      return '0'; // Всегда нужно approve в демо
    }

    try {
      const spender = await this.getSpender();
      const url = new URL(`${ONEINCH_API_URL}/swap/v5.2/${BASE_CHAIN_ID}/approve/allowance`, window.location.origin);
      url.searchParams.append('tokenAddress', tokenAddress);
      url.searchParams.append('walletAddress', walletAddress);
      url.searchParams.append('spenderAddress', spender);

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`1inch API error: ${response.status}`);
      }

      const data = await response.json();
      return data.allowance;
    } catch (error) {
      console.error('Failed to get allowance:', error);
      return '0';
    }
  }

  /**
   * Получить spender address
   */
  async getSpender(): Promise<string> {
    if (this.isDemoMode) {
      return ONEINCH_ROUTER;
    }

    try {
      const response = await fetch(`${window.location.origin}${ONEINCH_API_URL}/swap/v5.2/${BASE_CHAIN_ID}/approve/spender`);
      
      if (!response.ok) {
        throw new Error(`1inch API error: ${response.status}`);
      }

      const data = await response.json();
      return data.address;
    } catch (error) {
      console.error('Failed to get spender:', error);
      return ONEINCH_ROUTER;
    }
  }

  /**
   * Подготовить batch calls для множественных свапов
   * Оптимизированная версия с минимальными транзакциями
   */
  async prepareBatchSwapCalls(params: {
    swaps: SwapParams[];
    walletAddress: string;
    slippage?: number;
  }): Promise<BatchSwapCall[]> {
    const calls: BatchSwapCall[] = [];
    const tokenApprovals = new Map<string, bigint>(); // Токен -> максимальная сумма

    // 1. Собираем все необходимые approve суммы для каждого токена
    for (const swap of params.swaps) {
      if (!this.isNativeToken(swap.fromToken.address)) {
        const amount = parseUnits(swap.amount, swap.fromToken.decimals);
        const currentMax = tokenApprovals.get(swap.fromToken.address) || BigInt(0);
        
        if (amount > currentMax) {
          tokenApprovals.set(swap.fromToken.address, amount);
        }
      }
    }

    // 2. Добавляем один approve для каждого токена (если нужен)
    for (const [tokenAddress, amount] of tokenApprovals) {
      const allowance = await this.getAllowance(tokenAddress, params.walletAddress);
      
      if (BigInt(allowance) < amount) {
        console.log(`💰 Adding approve for ${tokenAddress}: ${amount.toString()}`);
        
        const approveTx = await this.getApproveTransaction(
          tokenAddress,
          amount.toString(),
          18 // Используем 18 decimals для approve
        );
        
        calls.push({
          to: approveTx.to,
          data: approveTx.data,
          value: approveTx.value,
        });
      }
    }

    // 3. Добавляем все swap транзакции
    for (const swap of params.swaps) {
      const swapTx = await this.getSwapTransaction({
        ...swap,
        walletAddress: params.walletAddress,
        slippage: params.slippage,
      });

      calls.push({
        to: swapTx.to,
        data: swapTx.data,
        value: swapTx.value,
      });
    }

    console.log(`📦 Prepared ${calls.length} calls: ${tokenApprovals.size} approves + ${params.swaps.length} swaps`);
    return calls;
  }

  /**
   * Проверить, является ли токен нативным (ETH)
   */
  private isNativeToken(address: string): boolean {
    return address.toLowerCase() === ETH_ADDRESS.toLowerCase();
  }

  /**
   * Генерировать permit данные для ERC-2612 токенов
   * Экономит газ за счет подписи вместо approve транзакции
   */
  private async generatePermitData(
    tokenAddress: string, 
    amount: string, 
    walletAddress: string
  ): Promise<string | undefined> {
    try {
      // Проверяем, поддерживает ли токен permit (ERC-2612)
      const spender = await this.getSpender();
      const amountInWei = parseUnits(amount, 18); // Предполагаем 18 decimals
      
      // Для демо режима возвращаем undefined (будет использован обычный approve)
      if (this.isDemoMode) {
        return undefined;
      }

      // В реальном режиме можно добавить проверку поддержки permit
      // и генерацию подписи через wallet
      console.log('🔐 Generating permit data for:', tokenAddress);
      console.log('   Amount:', amountInWei.toString());
      console.log('   Spender:', spender);
      
      // TODO: Реализовать генерацию permit подписи
      // Пока возвращаем undefined для использования обычного approve
      return undefined;
      
    } catch (error) {
      console.error('Failed to generate permit data:', error);
      return undefined;
    }
  }

  // ==================== DEMO MODE METHODS ====================

  private getDemoQuote(params: SwapParams): SwapQuote {
    const amountInWei = BigInt(parseUnits(params.amount, params.fromToken.decimals).toString());
    let toAmount: bigint;

    // Простые курсы для демо
    if (
      params.fromToken.address.toLowerCase() === ETH_ADDRESS.toLowerCase() &&
      params.toToken.address === '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
    ) {
      // ETH -> USDC: ~3000 USDC за 1 ETH
      toAmount = (amountInWei * BigInt(3000)) / BigInt(1e12);
    } else if (
      params.fromToken.address === '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' &&
      params.toToken.address.toLowerCase() === ETH_ADDRESS.toLowerCase()
    ) {
      // USDC -> ETH: обратный курс
      toAmount = (amountInWei * BigInt(1e12)) / BigInt(3000);
    } else {
      // Остальные пары: 1:1 с небольшой комиссией
      toAmount = (amountInWei * BigInt(98)) / BigInt(100); // 2% комиссия
    }

    return {
      fromToken: params.fromToken,
      toToken: params.toToken,
      fromAmount: params.amount,
      toAmount: toAmount.toString(),
      gas: '150000',
      gasPrice: '2000000000',
      protocols: [],
    };
  }

  private getDemoSwapTransaction(params: SwapParams): SwapTransaction {
    const amount = parseUnits(params.amount, params.fromToken.decimals);
    
    return {
      to: ONEINCH_ROUTER as Address,
      data: '0x12aa3caf' as `0x${string}`, // swap() selector placeholder
      value: this.isNativeToken(params.fromToken.address) ? amount : BigInt(0),
      gas: '150000',
      gasPrice: '2000000000',
    };
  }

  private getDemoApproveTransaction(tokenAddress: string, amount: string): SwapTransaction {
    const amountInWei = parseUnits(amount, 18);
    
    return {
      to: tokenAddress as Address,
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: 'approve',
        args: [ONEINCH_ROUTER as Address, amountInWei],
      }),
      value: BigInt(0),
      gas: '50000',
      gasPrice: '2000000000',
    };
  }

  /**
   * Получить информацию о возможностях сервиса
   */
  getFeatures() {
    return {
      swaps: true,
      quotes: true,
      batchSwaps: true,
      demoMode: this.isDemoMode,
      hasApiKey: !!this.apiKey && this.apiKey !== 'your_1inch_api_key',
      network: 'Base',
      chainId: BASE_CHAIN_ID,
    };
  }
}

export const simpleSwapService = new SimpleSwapService();

