import { SwapQuote, Token } from '@/types';

const ONEINCH_API_URL = '/api/1inch';
const BASE_CHAIN_ID = 8453; // Base mainnet

interface OneInchSwapParams {
  src: string;
  dst: string;
  amount: string;
  from: string;
  slippage: number;
  disableEstimate?: boolean;
}

interface OneInchQuoteParams {
  src: string;
  dst: string;
  amount: string;
}

export class OneInchService {
  private static instance: OneInchService | null = null;
  private apiKey: string;
  private isDemoMode: boolean;
  private isInitialized: boolean = false;

  private constructor(apiKey: string = process.env.NEXT_PUBLIC_ONEINCH_API_KEY || '') {
    this.apiKey = apiKey;
    this.isDemoMode = !apiKey || apiKey === 'your_1inch_api_key';
    this.isInitialized = true;
  }

  public static getInstance(): OneInchService {
    if (!OneInchService.instance) {
      OneInchService.instance = new OneInchService();
    }
    return OneInchService.instance;
  }

  private async makeRequest(endpoint: string, params?: Record<string, any>) {
    const url = new URL(`${ONEINCH_API_URL}${endpoint}`, window.location.origin);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value.toString());
        }
      });
    }

    const headers: Record<string, string> = {
      'accept': 'application/json',
    };

    // Добавляем задержку для соблюдения rate limit в демо-режиме
    if (this.isDemoMode) {
      await this.sleep(1000); // 1 секунда между запросами
    }

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`1inch API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getQuote(params: OneInchQuoteParams): Promise<SwapQuote> {
    // Демо-режим: возвращаем моковые данные
    if (this.isDemoMode) {
      return this.getDemoQuote(params);
    }

    const data = await this.makeRequest(`/swap/v5.0/${BASE_CHAIN_ID}/quote`, params);
    
    return {
      fromToken: data.srcToken,
      toToken: data.dstToken,
      fromAmount: data.srcAmount,
      toAmount: data.dstAmount,
      gas: data.gas,
      gasPrice: data.gasPrice,
      protocols: data.protocols,
    };
  }

  private getDemoQuote(params: OneInchQuoteParams): SwapQuote {
    // Более реалистичная логика для демо с разными курсами
    const fromAmount = BigInt(params.amount);
    let toAmount: bigint;
    
    // Простые курсы для демо
    if (params.src === '0x0000000000000000000000000000000000000000' && params.dst === '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913') {
      // ETH -> USDC: ~3000 USDC за 1 ETH
      toAmount = fromAmount * BigInt(3000) / BigInt(1e12); // Учитываем разницу в decimals
    } else if (params.src === '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' && params.dst === '0x0000000000000000000000000000000000000000') {
      // USDC -> ETH: обратный курс
      toAmount = fromAmount * BigInt(1e12) / BigInt(3000);
    } else if (params.src === '0x0000000000000000000000000000000000000000' && params.dst === '0x4200000000000000000000000000000000000006') {
      // ETH -> WETH: 1:1
      toAmount = fromAmount;
    } else if (params.src === '0x4200000000000000000000000000000000000006' && params.dst === '0x0000000000000000000000000000000000000000') {
      // WETH -> ETH: 1:1
      toAmount = fromAmount;
    } else {
      // Остальные пары: 1:1 с небольшой комиссией
      toAmount = fromAmount * BigInt(98) / BigInt(100); // 2% комиссия
    }

    return {
      fromToken: { address: params.src, symbol: 'FROM', decimals: 18, name: 'From Token', chainId: BASE_CHAIN_ID },
      toToken: { address: params.dst, symbol: 'TO', decimals: 18, name: 'To Token', chainId: BASE_CHAIN_ID },
      fromAmount: params.amount,
      toAmount: toAmount.toString(),
      gas: '150000',
      gasPrice: '2000000000',
      protocols: [],
    };
  }

  async getSwapTransaction(params: OneInchSwapParams) {
    // Демо-режим: возвращаем моковые данные транзакции
    if (this.isDemoMode) {
      return this.getDemoSwapTransaction(params);
    }

    return this.makeRequest(`/swap/v5.0/${BASE_CHAIN_ID}/swap`, params);
  }

  private getDemoSwapTransaction(params: OneInchSwapParams) {
    // Моковая транзакция для демо с правильным расчетом toAmount
    const fromAmount = BigInt(params.amount);
    let toAmount: bigint;
    
    // Используем ту же логику, что и в getDemoQuote
    if (params.src === '0x0000000000000000000000000000000000000000' && params.dst === '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913') {
      toAmount = fromAmount * BigInt(3000) / BigInt(1e12);
    } else if (params.src === '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' && params.dst === '0x0000000000000000000000000000000000000000') {
      toAmount = fromAmount * BigInt(1e12) / BigInt(3000);
    } else if (params.src === '0x0000000000000000000000000000000000000000' && params.dst === '0x4200000000000000000000000000000000000006') {
      toAmount = fromAmount;
    } else if (params.src === '0x4200000000000000000000000000000000000006' && params.dst === '0x0000000000000000000000000000000000000000') {
      toAmount = fromAmount;
    } else {
      toAmount = fromAmount * BigInt(98) / BigInt(100);
    }

    return {
      tx: {
        to: '0x1111111254EEB25477B68fb85Ed929f73A960582', // 1inch router
        data: '0x' + '0'.repeat(200), // Моковые данные
        value: '0',
        gas: '150000',
        gasPrice: '2000000000',
      },
      fromAmount: params.amount,
      toAmount: toAmount.toString(),
    };
  }

  async getTokens(): Promise<Record<string, Token>> {
    // Демо-режим: возвращаем базовые токены
    if (this.isDemoMode) {
      return this.getDemoTokens();
    }

    return this.makeRequest(`/swap/v5.2/${BASE_CHAIN_ID}/tokens`);
  }

  private getDemoTokens(): Record<string, Token> {
    return {
      '0x0000000000000000000000000000000000000000': {
        address: '0x0000000000000000000000000000000000000000',
        symbol: 'ETH',
        name: 'Ethereum',
        decimals: 18,
        chainId: BASE_CHAIN_ID,
      },
      '0x4200000000000000000000000000000000000006': {
        address: '0x4200000000000000000000000000000000000006',
        symbol: 'WETH',
        name: 'Wrapped Ethereum',
        decimals: 18,
        chainId: BASE_CHAIN_ID,
      },
      '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913': {
        address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        chainId: BASE_CHAIN_ID,
      },
      '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb': {
        address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
        symbol: 'DAI',
        name: 'Dai Stablecoin',
        decimals: 18,
        chainId: BASE_CHAIN_ID,
      },
    };
  }

  async getSpender(): Promise<string> {
    // Демо-режим: возвращаем моковый spender
    if (this.isDemoMode) {
      return '0x1111111254EEB25477B68fb85Ed929f73A960582'; // 1inch router
    }

    const data = await this.makeRequest(`/swap/v5.2/${BASE_CHAIN_ID}/approve/spender`);
    return data.address;
  }

  async getAllowance(tokenAddress: string, walletAddress: string): Promise<string> {
    // Демо-режим: возвращаем моковый allowance
    if (this.isDemoMode) {
      return '0'; // Всегда нужно approve в демо
    }

    const spender = await this.getSpender();
    const data = await this.makeRequest(`/swap/v5.2/${BASE_CHAIN_ID}/approve/allowance`, {
      tokenAddress,
      walletAddress,
      spenderAddress: spender,
    });
    return data.allowance;
  }

  async getApproveTransaction(tokenAddress: string, amount?: string) {
    // Демо-режим: возвращаем моковую транзакцию approve
    if (this.isDemoMode) {
      return this.getDemoApproveTransaction(tokenAddress, amount);
    }

    return this.makeRequest(`/swap/v5.2/${BASE_CHAIN_ID}/approve/transaction`, {
      tokenAddress,
      amount,
    });
  }

  private getDemoApproveTransaction(tokenAddress: string, amount?: string) {
    return {
      to: tokenAddress,
      data: '0x' + '0'.repeat(200), // Моковые данные approve
      value: '0',
      gas: '50000',
      gasPrice: '2000000000',
    };
  }

  // Limit Orders functionality (требует API ключ)
  async createLimitOrder(params: {
    makerAsset: string;
    takerAsset: string;
    makerAmount: string;
    takerAmount: string;
    maker: string;
    receiver?: string;
  }) {
    if (this.isDemoMode) {
      throw new Error('Limit orders require API key. Get one at https://portal.1inch.dev/');
    }

    const url = new URL(`${ONEINCH_API_URL}/orderbook/v4.0/8453/order`, window.location.origin);
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`1inch API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  async getLimitOrders(maker?: string, page = 1, limit = 100) {
    if (this.isDemoMode) {
      // Возвращаем пустой массив вместо ошибки для демо
      console.warn('Limit orders require API key. Returning empty array for demo.');
      return { orders: [] };
    }
    
    const params: Record<string, any> = { page, limit };
    if (maker) params.maker = maker;
    
    return this.makeRequest('/orderbook/v4.0/8453/order/all', params);
  }

  async cancelLimitOrder(orderHash: string) {
    if (this.isDemoMode) {
      throw new Error('Limit orders require API key. Get one at https://portal.1inch.dev/');
    }

    const url = new URL(`${ONEINCH_API_URL}/orderbook/v4.0/8453/order/${orderHash}`, window.location.origin);
    const response = await fetch(url.toString(), {
      method: 'DELETE',
      headers: {
        'accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`1inch API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  // Проверка доступности функций
  hasApiKey(): boolean {
    return !!(this.apiKey && this.apiKey !== 'your_1inch_api_key');
  }

  getFeatures() {
    return {
      swaps: true,
      quotes: true,
      limitOrders: this.hasApiKey(),
      rateLimit: this.hasApiKey() ? 'High (100 rps)' : 'Demo Mode',
      demoMode: this.isDemoMode,
    };
  }
}

// Export singleton instance
export const oneInchService = OneInchService.getInstance();
