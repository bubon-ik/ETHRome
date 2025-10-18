import { 
  TokenSearchResult, 
  TokenSearchResponse, 
  TokenInfoResponse, 
  TokenListResponse,
  TokenSearchParams,
  TokenInfoParams,
  TokenListParams
} from '@/types';

const TOKEN_API_URL = '/api/1inch-tokens';
const BASE_CHAIN_ID = 8453; // Base mainnet

export class TokenService {
  private static instance: TokenService | null = null;
  private apiKey: string;
  private isInitialized: boolean = false;

  private constructor(apiKey: string = process.env.NEXT_PUBLIC_ONEINCH_API_KEY || '') {
    this.apiKey = apiKey;
    this.isInitialized = true;
  }

  public static getInstance(): TokenService {
    if (!TokenService.instance) {
      TokenService.instance = new TokenService();
    }
    return TokenService.instance;
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

  /**
   * Поиск токенов по запросу
   */
  async searchTokens(params: TokenSearchParams): Promise<TokenSearchResult[]> {
    const data = await this.makeRequest(`/search`, {
      query: params.query,
      limit: params.limit || 10,
      ignore_listed: params.ignoreListed ? 'true' : 'false'
    });

    // API возвращает массив токенов напрямую
    return Array.isArray(data) ? data : [];
  }

  /**
   * Получение информации о конкретных токенах
   */
  async getTokensInfo(params: TokenInfoParams): Promise<TokenInfoResponse> {
    const data = await this.makeRequest(`/custom/${params.addresses.join(',')}`);
    return data || {};
  }

  /**
   * Получение всех токенов из токен-листа
   */
  async getAllTokensInfo(params: TokenListParams): Promise<TokenSearchResult[]> {
    const data = await this.makeRequest(`/all`, {
      provider: params.provider || '1inch'
    });

    // API возвращает объект с полем tokens
    return data?.tokens || [];
  }

  /**
   * Получение токен-листа 1inch
   */
  async get1inchTokenList(params: TokenListParams): Promise<TokenSearchResult[]> {
    const data = await this.makeRequest(`/token-list`, {
      provider: params.provider || '1inch'
    });

    // API возвращает объект с полем tokens
    return data?.tokens || [];
  }

  // Проверка доступности функций
  hasApiKey(): boolean {
    return !!(this.apiKey && this.apiKey !== 'your_1inch_api_key');
  }

  getFeatures() {
    return {
      tokenSearch: true,
      tokenInfo: true,
      tokenLists: true,
      rateLimit: 'High (100 rps)',
      apiKey: this.hasApiKey(),
    };
  }
}

// Export singleton instance
export const tokenService = TokenService.getInstance();
