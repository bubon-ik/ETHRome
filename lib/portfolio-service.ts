import { 
  PortfolioToken, 
  PortfolioSummary, 
  PortfolioHistory,
  PortfolioData,
  PortfolioParams
} from '@/types';

const PORTFOLIO_API_URL = '/api/1inch-portfolio';
const BASE_CHAIN_ID = 8453; // Base mainnet

export class PortfolioService {
  private static instance: PortfolioService | null = null;
  private apiKey: string;
  private isInitialized: boolean = false;

  private constructor(apiKey: string = process.env.NEXT_PUBLIC_ONEINCH_API_KEY || '') {
    this.apiKey = apiKey;
    this.isInitialized = true;
  }

  public static getInstance(): PortfolioService {
    if (!PortfolioService.instance) {
      PortfolioService.instance = new PortfolioService();
    }
    return PortfolioService.instance;
  }

  private async makeRequest(endpoint: string, params?: Record<string, any>) {
    const url = new URL(`${PORTFOLIO_API_URL}${endpoint}`, window.location.origin);

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
      throw new Error(`1inch Portfolio API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Получение балансов токенов портфолио
   */
  async getPortfolioBalances(params: PortfolioParams): Promise<PortfolioToken[]> {
    const data = await this.makeRequest(`/balances/${params.chainId}/${params.address}`, {
      currency: params.currency || 'USD'
    });

    // Преобразуем данные в нужный формат
    if (Array.isArray(data)) {
      return data.map((token: any) => ({
        address: token.address,
        symbol: token.symbol,
        name: token.name,
        decimals: token.decimals,
        logoURI: token.logoURI,
        balance: token.balance || '0',
        balanceFormatted: token.balanceFormatted || '0',
        price: token.price || 0,
        value: token.value || 0,
        valueFormatted: token.valueFormatted || '$0.00',
        change24h: token.change24h,
        change24hPercent: token.change24hPercent
      }));
    }

    return [];
  }

  /**
   * Получение сводки портфолио
   */
  async getPortfolioSummary(params: PortfolioParams): Promise<PortfolioSummary | null> {
    const data = await this.makeRequest(`/summary/${params.chainId}/${params.address}`, {
      currency: params.currency || 'USD'
    });

    if (data) {
      return {
        totalValue: data.totalValue || 0,
        totalValueFormatted: data.totalValueFormatted || '$0.00',
        change24h: data.change24h || 0,
        change24hPercent: data.change24hPercent || 0,
        tokenCount: data.tokenCount || 0,
        currency: data.currency || 'USD'
      };
    }

    return null;
  }

  /**
   * Получение истории портфолио
   */
  async getPortfolioHistory(params: PortfolioParams): Promise<PortfolioHistory[]> {
    const data = await this.makeRequest(`/history/${params.chainId}/${params.address}`, {
      currency: params.currency || 'USD',
      period: params.period || '1d'
    });

    if (Array.isArray(data)) {
      return data.map((item: any) => ({
        timestamp: item.timestamp,
        value: item.value || 0,
        change: item.change || 0
      }));
    }

    return [];
  }

  /**
   * Получение полных данных портфолио
   */
  async getPortfolioData(params: PortfolioParams): Promise<PortfolioData | null> {
    try {
      const [tokens, summary, history] = await Promise.all([
        this.getPortfolioBalances(params),
        this.getPortfolioSummary(params),
        this.getPortfolioHistory(params)
      ]);

      if (!summary) {
        return null;
      }

      return {
        tokens,
        summary,
        history
      };
    } catch (error) {
      console.error('Failed to get portfolio data:', error);
      return null;
    }
  }

  // Проверка доступности функций
  hasApiKey(): boolean {
    return !!(this.apiKey && this.apiKey !== 'your_1inch_api_key');
  }

  getFeatures() {
    return {
      portfolioBalances: true,
      portfolioSummary: true,
      portfolioHistory: true,
      rateLimit: 'High (100 rps)',
      apiKey: this.hasApiKey(),
    };
  }
}

// Export singleton instance
export const portfolioService = PortfolioService.getInstance();
