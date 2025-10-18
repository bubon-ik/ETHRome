import { SwapQuote, Token } from '@/types';
import { 
  LimitOrder, 
  Api, 
  FetchProviderConnector, 
  Address,
  MakerTraits,
  TakerTraits,
  LimitOrderContract,
  AmountMode
} from '@1inch/limit-order-sdk';

const BASE_CHAIN_ID = 8453; // Base mainnet

export class OneInchLimitOrderService {
  private static instance: OneInchLimitOrderService | null = null;
  private api: Api | null = null;
  private isDemoMode: boolean = true;
  private isInitialized: boolean = false;

  private constructor() {
    // Private constructor to prevent direct instantiation
  }

  public static getInstance(): OneInchLimitOrderService {
    if (!OneInchLimitOrderService.instance) {
      OneInchLimitOrderService.instance = new OneInchLimitOrderService();
      OneInchLimitOrderService.instance.initializeAPI();
    }
    return OneInchLimitOrderService.instance;
  }

  private initializeAPI() {
    if (this.isInitialized) {
      return; // Prevent multiple initializations
    }
    
    try {
      // API класс требует authKey для работы с 1inch API
      const apiKey = process.env.NEXT_PUBLIC_ONEINCH_API_KEY;
      
      if (apiKey) {
        this.api = new Api({
          networkId: BASE_CHAIN_ID,
          authKey: apiKey, // API ключ обязателен для Api класса
          httpConnector: new FetchProviderConnector()
        });
        
        this.isDemoMode = false;
        console.log('1inch Limit Order SDK initialized with API key!');
      } else {
        this.isDemoMode = true;
        this.api = null;
        console.log('1inch Limit Order SDK in demo mode - API key required for full functionality');
      }
      
      this.isInitialized = true; // Mark as initialized
    } catch (error) {
      console.warn('Failed to initialize 1inch Limit Order SDK, using demo mode:', error);
      this.isDemoMode = true;
      this.api = null;
      this.isInitialized = true; // Mark as initialized even on error
    }
  }

  // Создание лимит-ордера
  async createLimitOrder(params: {
    makerAsset: string;
    takerAsset: string;
    makerAmount: string;
    takerAmount: string;
    maker: string;
    signature: string;
  }) {
    if (this.isDemoMode) {
      console.log('Demo mode: Limit order creation requires API key');
      throw new Error('Limit orders require API key. Get one at https://portal.1inch.dev/');
    }

    if (!this.api) {
      throw new Error('API not initialized - API key required');
    }

    try {
      // Создаем лимит-ордер используя SDK
      const order = new LimitOrder({
        makerAsset: new Address(params.makerAsset),
        takerAsset: new Address(params.takerAsset),
        makingAmount: BigInt(params.makerAmount),
        takingAmount: BigInt(params.takerAmount),
        maker: new Address(params.maker),
      }, MakerTraits.default());

      // Отправляем ордер через API (требует API ключ)
      await this.api.submitOrder(order, params.signature);
      console.log('Order submitted via API');
      
      return {
        orderHash: order.getOrderHash(BASE_CHAIN_ID),
        order: order,
        success: true
      };
    } catch (error) {
      console.error('Failed to create limit order:', error);
      throw error;
    }
  }

  // Получение лимит-ордеров
  async getLimitOrders(maker?: string) {
    if (this.isDemoMode) {
      console.log('Demo mode: Getting limit orders requires API key');
      return { orders: [] };
    }

    if (!this.api) {
      throw new Error('API not initialized - API key required');
    }

    try {
      if (maker) {
        // Получаем ордеры конкретного мейкера через API
        const response = await this.api.getOrdersByMaker(new Address(maker), {
          statuses: [1] // только валидные ордеры
        });
        return { orders: response.items };
      } else {
        // Получаем все ордеры через API
        const response = await this.api.getAllOrders({
          statuses: [1, 2] // валидные и временно невалидные
        });
        return { orders: response.items };
      }
    } catch (error) {
      console.error('Failed to get limit orders via API:', error);
      return { orders: [] };
    }
  }

  // Отмена лимит-ордера
  async cancelLimitOrder(orderHash: string) {
    if (this.isDemoMode) {
      console.log('Demo mode: Cancel limit order requires API key');
      return { success: true };
    }

    if (!this.api) {
      throw new Error('API not initialized - API key required');
    }

    try {
      // Получаем информацию об ордере
      const orderInfo = await this.api.getOrderByHash(orderHash);
      
      if (!orderInfo) {
        throw new Error('Order not found');
      }

      // Для отмены нужно создать новый ордер с нулевыми суммами
      // Это стандартная практика в 1inch
      const cancelOrder = new LimitOrder({
        makerAsset: new Address(orderInfo.order.makerAsset),
        takerAsset: new Address(orderInfo.order.takerAsset),
        makingAmount: 0n, // Нулевая сумма = отмена
        takingAmount: 0n,
        maker: new Address(orderInfo.order.maker),
      }, MakerTraits.default());

      // Отправляем ордер отмены (нужна подпись от мейкера)
      // В реальном приложении здесь должна быть подпись от мейкера
      throw new Error('Order cancellation requires maker signature');
      
    } catch (error) {
      console.error('Failed to cancel limit order:', error);
      throw error;
    }
  }

  // Создание данных для выполнения лимит-ордера
  async getFillOrderCalldata(params: {
    orderHash: string;
    amount: string;
    taker: string;
  }) {
    if (this.isDemoMode) {
      console.log('Demo mode: Fill order calldata concept');
      return {
        to: '0x1111111254EEB25477B68fb85Ed929f73A960582', // 1inch router
        data: '0x' + '0'.repeat(200),
        value: '0'
      };
    }

    if (!this.api) {
      throw new Error('API not initialized');
    }

    try {
      // Получаем информацию об ордере
      const orderInfo = await this.api.getOrderByHash(params.orderHash);
      
      if (!orderInfo) {
        throw new Error('Order not found');
      }

      // Создаем TakerTraits для выполнения ордера
      const takerTraits = TakerTraits.default()
        .setAmountMode(AmountMode.TakerAmount)
        .setReceiver(new Address(params.taker));

      // Создаем калдату для выполнения ордера
      const calldata = LimitOrderContract.getFillOrderCalldata(
        orderInfo.order,
        orderInfo.signature,
        takerTraits,
        BigInt(params.amount)
      );

      return {
        to: '0x1111111254EEB25477B68fb85Ed929f73A960582', // 1inch Limit Order Protocol
        data: calldata,
        value: '0'
      };
    } catch (error) {
      console.error('Failed to get fill order calldata:', error);
      throw error;
    }
  }

  // Получение информации об ордере
  async getOrderInfo(orderHash: string) {
    if (this.isDemoMode) {
      console.log('Demo mode: Get order info concept');
      return null;
    }

    if (!this.api) {
      throw new Error('API not initialized');
    }

    try {
      const orderInfo = await this.api.getOrderByHash(orderHash);
      return orderInfo;
    } catch (error) {
      console.error('Failed to get order info:', error);
      return null;
    }
  }

  // Получение котировок (используем старый метод)
  async getQuote(params: {
    src: string;
    dst: string;
    amount: string;
  }): Promise<SwapQuote> {
    // Для котировок используем демо-данные
    const fromAmount = BigInt(params.amount);
    let toAmount: bigint;
    
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
      fromToken: { address: params.src, symbol: 'FROM', decimals: 18, name: 'From Token', chainId: BASE_CHAIN_ID },
      toToken: { address: params.dst, symbol: 'TO', decimals: 18, name: 'To Token', chainId: BASE_CHAIN_ID },
      fromAmount: params.amount,
      toAmount: toAmount.toString(),
      gas: '150000',
      gasPrice: '2000000000',
      protocols: [],
    };
  }

  // Получение данных для swap транзакции (демо)
  async getSwapTransaction(params: {
    src: string;
    dst: string;
    amount: string;
    from: string;
    slippage: number;
  }) {
    const fromAmount = BigInt(params.amount);
    let toAmount: bigint;
    
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
        to: '0x1111111254EEB25477B68fb85Ed929f73A960582',
        data: '0x' + '0'.repeat(200),
        value: '0',
        gas: '150000',
        gasPrice: '2000000000',
      },
      fromAmount: params.amount,
      toAmount: toAmount.toString(),
    };
  }

  getFeatures() {
    return {
      swaps: true,
      quotes: true,
      limitOrders: !this.isDemoMode, // API ключ нужен для лимит-ордеров
      rateLimit: this.isDemoMode ? 'Demo Mode (API Key Required)' : 'High (Limit Order SDK)',
      demoMode: this.isDemoMode,
      sdkMode: true,
    };
  }
}

// Export singleton instance
export const oneInchLimitOrderService = OneInchLimitOrderService.getInstance();
