import { SwapQuote, Token } from '@/types';

const ONEINCH_API_URL = 'https://api.1inch.dev';
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
  private apiKey: string;

  constructor(apiKey: string = process.env.NEXT_PUBLIC_ONEINCH_API_KEY || '') {
    this.apiKey = apiKey;
  }

  private async makeRequest(endpoint: string, params?: Record<string, any>) {
    const url = new URL(`${ONEINCH_API_URL}${endpoint}`);
    
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

    // API ключ опционален - работает и без него (с ограничениями)
    if (this.apiKey && this.apiKey !== 'your_1inch_api_key') {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    // Добавляем задержку для соблюдения rate limit без API ключа
    if (!this.apiKey || this.apiKey === 'your_1inch_api_key') {
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
    const data = await this.makeRequest(`/swap/v6.0/${BASE_CHAIN_ID}/quote`, params);
    
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

  async getSwapTransaction(params: OneInchSwapParams) {
    return this.makeRequest(`/swap/v6.0/${BASE_CHAIN_ID}/swap`, params);
  }

  async getTokens(): Promise<Record<string, Token>> {
    return this.makeRequest(`/swap/v6.0/${BASE_CHAIN_ID}/tokens`);
  }

  async getSpender(): Promise<string> {
    const data = await this.makeRequest(`/swap/v6.0/${BASE_CHAIN_ID}/approve/spender`);
    return data.address;
  }

  async getAllowance(tokenAddress: string, walletAddress: string): Promise<string> {
    const spender = await this.getSpender();
    const data = await this.makeRequest(`/swap/v6.0/${BASE_CHAIN_ID}/approve/allowance`, {
      tokenAddress,
      walletAddress,
      spenderAddress: spender,
    });
    return data.allowance;
  }

  async getApproveTransaction(tokenAddress: string, amount?: string) {
    return this.makeRequest(`/swap/v6.0/${BASE_CHAIN_ID}/approve/transaction`, {
      tokenAddress,
      amount,
    });
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
    if (!this.apiKey || this.apiKey === 'your_1inch_api_key') {
      throw new Error('Limit orders require API key. Get one at https://portal.1inch.dev/');
    }
    
    return this.makeRequest('/orderbook/v4.0/8453/order', params);
  }

  async getLimitOrders(maker?: string, page = 1, limit = 100) {
    if (!this.apiKey || this.apiKey === 'your_1inch_api_key') {
      // Возвращаем пустой массив вместо ошибки для демо
      console.warn('Limit orders require API key. Returning empty array for demo.');
      return { orders: [] };
    }
    
    const params: Record<string, any> = { page, limit };
    if (maker) params.maker = maker;
    
    return this.makeRequest('/orderbook/v4.0/8453/order/all', params);
  }

  async cancelLimitOrder(orderHash: string) {
    if (!this.apiKey || this.apiKey === 'your_1inch_api_key') {
      throw new Error('Limit orders require API key. Get one at https://portal.1inch.dev/');
    }
    
    return this.makeRequest(`/orderbook/v4.0/8453/order/${orderHash}`, {
      method: 'DELETE',
    });
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
      rateLimit: this.hasApiKey() ? 'High (100 rps)' : 'Low (1 rps)'
    };
  }
}

export const oneInchService = new OneInchService();
