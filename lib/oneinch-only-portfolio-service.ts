import { 
  PortfolioToken, 
  PortfolioSummary, 
  PortfolioData,
  PortfolioParams
} from '@/types';

const TOKEN_API_URL = '/api/1inch-tokens';
const QUOTE_API_URL = '/api/1inch';
const BASE_CHAIN_ID = 8453; // Base mainnet

export class OneInchOnlyPortfolioService {
  private static instance: OneInchOnlyPortfolioService | null = null;
  private apiKey: string;
  private isInitialized: boolean = false;

  private constructor(apiKey: string = process.env.NEXT_PUBLIC_ONEINCH_API_KEY || '') {
    this.apiKey = apiKey;
    this.isInitialized = true;
  }

  public static getInstance(): OneInchOnlyPortfolioService {
    if (!OneInchOnlyPortfolioService.instance) {
      OneInchOnlyPortfolioService.instance = new OneInchOnlyPortfolioService();
    }
    return OneInchOnlyPortfolioService.instance;
  }

  private async makeRequest(endpoint: string, params?: Record<string, any>) {
    const url = new URL(`${TOKEN_API_URL}${endpoint}`, window.location.origin);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value.toString());
        }
      });
    }

    // Добавляем уникальный параметр для предотвращения кэширования
    url.searchParams.append('_t', Date.now().toString());

    const headers: Record<string, string> = {
      'accept': 'application/json',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
    };

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`1inch Token API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  private async makeQuoteRequest(endpoint: string, params?: Record<string, any>) {
    const url = new URL(`${QUOTE_API_URL}${endpoint}`, window.location.origin);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value.toString());
        }
      });
    }

    // Добавляем уникальный параметр для предотвращения кэширования
    url.searchParams.append('_t', Date.now().toString());

    const headers: Record<string, string> = {
      'accept': 'application/json',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
    };

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`1inch Quote API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Получение всех токенов из 1inch Token API
   */
  async getAllTokens(): Promise<any[]> {
    const data = await this.makeRequest(`/token-list`, {
      chainId: BASE_CHAIN_ID,
      provider: '1inch'
    });

    return data.tokens || [];
  }

  /**
   * Получение баланса токена через 1inch API (если доступно)
   * Пока используем Base RPC, но в будущем можно заменить на 1inch API
   */
  async getTokenBalance(tokenAddress: string, walletAddress: string): Promise<string> {
    try {
      // Для ETH используем Base RPC
      if (tokenAddress === '0x0000000000000000000000000000000000000000') {
        const response = await fetch(`https://mainnet.base.org`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getBalance',
            params: [walletAddress, 'latest'],
            id: 1
          })
        });
        
        const data = await response.json();
        return data.result || '0x0';
      }

      // Для ERC-20 токенов используем Base RPC
      const response = await fetch(`https://mainnet.base.org`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_call',
          params: [{
            to: tokenAddress,
            data: `0x70a08231000000000000000000000000${walletAddress.slice(2)}`
          }, 'latest'],
          id: 1
        })
      });
      
      const data = await response.json();
      return data.result || '0x0';
    } catch (error) {
      console.error('Failed to get token balance:', error);
      return '0x0';
    }
  }

  /**
   * Получение цены токена через 1inch Quote API
   */
  async getTokenPrice(tokenAddress: string): Promise<number> {
    try {
      // Используем 1inch Quote API для получения цены токена
      // Конвертируем токен в USDC для получения цены в USD
      const usdcAddress = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // USDC на Base
      
      if (tokenAddress.toLowerCase() === usdcAddress.toLowerCase()) {
        return 1; // USDC = $1
      }
      
      // Получаем цену через 1inch Quote API
      const data = await this.makeQuoteRequest(`/quote/v5.2/8453/quote`, {
        fromTokenAddress: tokenAddress,
        toTokenAddress: usdcAddress,
        amount: '1000000000000000000' // 1 токен в wei
      });
      
      if (data.toTokenAmount) {
        // Конвертируем из wei в обычные единицы
        const price = parseFloat(data.toTokenAmount) / Math.pow(10, 6); // USDC имеет 6 decimals
        return price;
      }
      
      return 0;
    } catch (error) {
      console.error('Failed to get token price via 1inch:', error);
      return 0;
    }
  }

  /**
   * Получение данных портфолио используя только 1inch API
   */
  async getPortfolioData(params: PortfolioParams): Promise<PortfolioData | null> {
    try {
      console.log('Getting portfolio data using only 1inch API for:', params.address);
      
      // Получаем все токены из 1inch Token API
      const allTokens = await this.getAllTokens();
      console.log('Found tokens from 1inch:', allTokens.length);
      
      // Получаем балансы и цены для каждого токена
      const tokensWithBalances: PortfolioToken[] = [];
      let totalValue = 0;
      
      // Ограничиваем количество токенов для производительности
      const tokensToCheck = allTokens.slice(0, 15);
      
      for (const token of tokensToCheck) {
        try {
          const balanceHex = await this.getTokenBalance(token.address, params.address);
          const balance = parseInt(balanceHex, 16);
          
          if (balance > 0) {
            const price = await this.getTokenPrice(token.address);
            const value = (balance / Math.pow(10, token.decimals)) * price;
            
            tokensWithBalances.push({
              address: token.address,
              symbol: token.symbol,
              name: token.name,
              decimals: token.decimals,
              logoURI: token.logoURI,
              balance: balance.toString(),
              balanceFormatted: (balance / Math.pow(10, token.decimals)).toFixed(6),
              price: price,
              value: value,
              valueFormatted: `$${value.toFixed(2)}`,
              change24h: 0,
              change24hPercent: 0
            });
            
            totalValue += value;
          }
        } catch (error) {
          console.error(`Failed to process token ${token.symbol}:`, error);
        }
      }
      
      // Создаем сводку портфолио
      const summary: PortfolioSummary = {
        totalValue: totalValue,
        totalValueFormatted: `$${totalValue.toFixed(2)}`,
        change24h: 0,
        change24hPercent: 0,
        tokenCount: tokensWithBalances.length,
        currency: 'USD'
      };
      
      return {
        tokens: tokensWithBalances,
        summary: summary,
        history: []
      };
      
    } catch (error) {
      console.error('Failed to get portfolio data via 1inch:', error);
      return null;
    }
  }

  // Проверка доступности функций
  hasApiKey(): boolean {
    return !!(this.apiKey && this.apiKey !== 'your_1inch_api_key');
  }

  getFeatures() {
    return {
      oneInchOnly: true,
      tokenList: true,
      tokenPrices: true,
      portfolioData: true,
      rateLimit: 'High (100 rps)',
      apiKey: this.hasApiKey(),
    };
  }
}

// Export singleton instance
export const oneInchOnlyPortfolioService = OneInchOnlyPortfolioService.getInstance();


