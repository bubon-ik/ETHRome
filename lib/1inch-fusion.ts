/**
 * 1inch Fusion SDK Service for Base Mainnet Batch Swaps
 * 
 * Fusion SDK enables gasless swap orders executed through resolvers (relayers)
 * Resolvers pay gas fees and take a small commission
 * 
 * @see https://github.com/1inch/fusion-sdk
 * @see https://portal.1inch.dev/documentation
 */

import { FusionSDK, NetworkEnum, OrderStatus } from '@1inch/fusion-sdk';
import type { Address } from 'viem';
import { SwapQuote, Token } from '@/types';

const BASE_CHAIN_ID = 8453; // Base mainnet

// ETH address constants
const ETH_ADDRESS = '0x0000000000000000000000000000000000000000';
const ETH_ADDRESS_FUSION = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

export interface FusionOrder {
  orderHash: string;
  status: OrderStatus;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  maker: string;
  createTimestamp?: number;
}

export interface BatchSwapOrder {
  route: {
    from: Token & { amount: string };
    to: Token;
  };
  order: FusionOrder;
}

export class OneInchFusionService {
  private sdk: FusionSDK | null = null;
  private isDemoMode: boolean = false;
  private apiKey: string | null = null;

  constructor() {
    this.initializeSDK();
  }

  /**
   * Normalize token address for Fusion SDK
   * Converts zero address to Fusion's ETH address
   */
  private normalizeTokenAddress(address: string): string {
    if (address.toLowerCase() === ETH_ADDRESS.toLowerCase()) {
      return ETH_ADDRESS_FUSION;
    }
    return address;
  }

  /**
   * Initialize Fusion SDK with Base network support
   * NOTE: Base uses chain ID directly, not NetworkEnum
   */
  private initializeSDK() {
    try {
      this.apiKey = process.env.NEXT_PUBLIC_ONEINCH_API_KEY || null;
      
      if (!this.apiKey) {
        console.warn('⚠️ 1inch API key not found. Using demo mode.');
        console.log('📝 Get API key at: https://portal.1inch.dev/');
        this.isDemoMode = true;
        return;
      }

      console.log('🔍 Initializing Fusion SDK for Base network...');
      console.log('🔑 API Key:', this.apiKey.substring(0, 8) + '...');

      // Initialize Fusion SDK for Base mainnet
      // Use chain ID directly as network parameter
      this.sdk = new FusionSDK({
        url: 'https://api.1inch.dev/fusion',
        network: BASE_CHAIN_ID, // 8453 - Base mainnet
        blockchainProvider: undefined,
        authKey: this.apiKey,
      });

      this.isDemoMode = false;
      console.log('✅ 1inch Fusion SDK initialized successfully!');
      console.log(`📡 Network: Base (Chain ID: ${BASE_CHAIN_ID})`);
      
    } catch (error) {
      console.error('❌ Failed to initialize 1inch Fusion SDK:', error);
      console.error('Error details:', error instanceof Error ? error.message : error);
      console.log('🔄 Falling back to demo mode.');
      this.isDemoMode = true;
      this.sdk = null;
    }
  }

  /**
   * Get Fusion swap quote
   * Returns estimated output amount and execution details
   */
  async getFusionQuote(params: {
    fromTokenAddress: string;
    toTokenAddress: string;
    amount: string;
    walletAddress: string;
  }): Promise<SwapQuote> {
    // Check if SDK is available
    if (this.isDemoMode || !this.sdk) {
      console.log('📝 Using demo quote (SDK not available)');
      return this.getDemoQuote(params);
    }

    try {
      // Normalize addresses for Fusion SDK
      const normalizedFromAddress = this.normalizeTokenAddress(params.fromTokenAddress);
      const normalizedToAddress = this.normalizeTokenAddress(params.toTokenAddress);
      
      // Validate amount
      if (!params.amount || params.amount === '0' || params.amount === '0.0') {
        throw new Error('Invalid amount: ' + params.amount);
      }
      
      console.log('🔍 Getting Fusion quote:', {
        from: normalizedFromAddress,
        to: normalizedToAddress,
        amount: params.amount,
        wallet: params.walletAddress
      });
      
      // Get quote from Fusion SDK
      const quote = await this.sdk.getQuote({
        fromTokenAddress: normalizedFromAddress,
        toTokenAddress: normalizedToAddress,
        amount: params.amount,
        walletAddress: params.walletAddress,
      });

      console.log('✅ Fusion quote received:', {
        dstAmount: quote.dstAmount,
        feeToken: quote.feeToken,
        protocols: quote.protocols?.length || 0
      });

      return {
        fromToken: {
          address: params.fromTokenAddress,
          symbol: quote.srcToken?.symbol || 'TOKEN',
          name: quote.srcToken?.name || 'Token',
          decimals: quote.srcToken?.decimals || 18,
          chainId: BASE_CHAIN_ID,
        },
        toToken: {
          address: params.toTokenAddress,
          symbol: quote.dstToken?.symbol || 'TOKEN',
          name: quote.dstToken?.name || 'Token',
          decimals: quote.dstToken?.decimals || 18,
          chainId: BASE_CHAIN_ID,
        },
        fromAmount: params.amount,
        toAmount: quote.dstAmount,
        gas: '0', // Gasless - resolvers pay gas
        gasPrice: '0',
        protocols: quote.protocols || [],
      };
    } catch (error) {
      console.error('❌ Failed to get Fusion quote:', error);
      console.error('Error message:', error instanceof Error ? error.message : error);
      console.log('🔄 Falling back to demo quote...');
      
      // Return demo quote as fallback
      return this.getDemoQuote(params);
    }
  }

  /**
   * Create Fusion order for gasless swap
   * Order will be executed by resolvers automatically
   */
  async createFusionOrder(params: {
    fromTokenAddress: string;
    toTokenAddress: string;
    amount: string;
    walletAddress: string;
    permit?: string;
  }): Promise<FusionOrder> {
    console.log('🔍 Creating Fusion order:', {
      isDemoMode: this.isDemoMode,
      hasSDK: !!this.sdk,
      from: params.fromTokenAddress,
      to: params.toTokenAddress,
      amount: params.amount
    });
    
    if (this.isDemoMode || !this.sdk) {
      console.log('📝 Creating demo Fusion order');
      return this.createDemoOrder(params);
    }

    try {
      // Normalize addresses
      const normalizedFromAddress = this.normalizeTokenAddress(params.fromTokenAddress);
      const normalizedToAddress = this.normalizeTokenAddress(params.toTokenAddress);
      
      console.log('📡 Requesting quote from 1inch Fusion API...');
      
      // Get quote first
      const quote = await this.sdk.getQuote({
        fromTokenAddress: normalizedFromAddress,
        toTokenAddress: normalizedToAddress,
        amount: params.amount,
        walletAddress: params.walletAddress,
        permit: params.permit,
      });

      console.log('✅ Quote received, creating order...');

      // Place order with quote
      const orderParams = await this.sdk.placeOrder(quote);

      console.log('✅ Fusion order created:', {
        orderHash: orderParams.orderHash,
        status: 'Pending'
      });

      return {
        orderHash: orderParams.orderHash,
        status: OrderStatus.Pending,
        fromToken: params.fromTokenAddress,
        toToken: params.toTokenAddress,
        fromAmount: params.amount,
        toAmount: quote.dstAmount,
        maker: params.walletAddress,
        createTimestamp: Date.now(),
      };
    } catch (error) {
      console.error('❌ Failed to create Fusion order:', error);
      console.error('Error details:', error instanceof Error ? error.message : error);
      
      // Check if it's an authentication error
      if (error instanceof Error && error.message.includes('401')) {
        console.error('🔐 Authentication failed. Check your API key.');
        console.error('API Key used:', this.apiKey?.substring(0, 8) + '...');
      }
      
      throw error;
    }
  }

  /**
   * Create batch Fusion orders for multiple swaps
   */
  async createBatchFusionOrders(params: {
    routes: Array<{
      from: Token & { amount: string };
      to: Token;
    }>;
    walletAddress: string;
  }): Promise<BatchSwapOrder[]> {
    if (this.isDemoMode || !this.sdk) {
      console.log('📝 Demo mode: Creating mock batch Fusion orders');
      return params.routes.map((route) => ({
        route,
        order: this.createDemoOrder({
          fromTokenAddress: route.from.address,
          toTokenAddress: route.to.address,
          amount: route.from.amount,
          walletAddress: params.walletAddress,
        }),
      }));
    }

    try {
      const orders: BatchSwapOrder[] = [];

      console.log(`🔄 Creating ${params.routes.length} Fusion orders...`);

      for (const route of params.routes) {
        console.log(`📝 Creating order for ${route.from.symbol} → ${route.to.symbol}`);
        
        const order = await this.createFusionOrder({
          fromTokenAddress: route.from.address,
          toTokenAddress: route.to.address,
          amount: route.from.amount,
          walletAddress: params.walletAddress,
        });

        orders.push({ route, order });
      }

      console.log(`✅ Created ${orders.length} Fusion orders successfully!`);
      return orders;
      
    } catch (error) {
      console.error('❌ Failed to create batch Fusion orders:', error);
      throw error;
    }
  }

  /**
   * Get status of a Fusion order
   */
  async getOrderStatus(orderHash: string): Promise<OrderStatus> {
    if (this.isDemoMode || !this.sdk) {
      return OrderStatus.Pending;
    }

    try {
      const order = await this.sdk.getOrderStatus(orderHash);
      return order.status;
    } catch (error) {
      console.error('Failed to get order status:', error);
      return OrderStatus.Pending;
    }
  }

  /**
   * Get all active orders for a wallet
   */
  async getActiveOrders(walletAddress: string): Promise<FusionOrder[]> {
    if (this.isDemoMode || !this.sdk) {
      return [];
    }

    try {
      const orders = await this.sdk.getActiveOrders({
        address: walletAddress,
      });

      return orders.items.map(order => ({
        orderHash: order.orderHash,
        status: order.status,
        fromToken: order.order.makerAsset,
        toToken: order.order.takerAsset,
        fromAmount: order.order.makingAmount,
        toAmount: order.order.takingAmount,
        maker: order.order.maker,
        createTimestamp: order.createDateTime,
      }));
    } catch (error) {
      console.error('Failed to get active orders:', error);
      return [];
    }
  }

  /**
   * Cancel a Fusion order
   */
  async cancelOrder(orderHash: string): Promise<boolean> {
    if (this.isDemoMode || !this.sdk) {
      console.log('Demo mode: Order cancellation simulated');
      return true;
    }

    try {
      await this.sdk.cancelOrder(orderHash);
      console.log('✅ Order cancelled:', orderHash);
      return true;
    } catch (error) {
      console.error('Failed to cancel order:', error);
      return false;
    }
  }

  /**
   * Get SDK feature information
   */
  getFeatures() {
    return {
      fusionSwaps: !this.isDemoMode,
      gaslessTransactions: !this.isDemoMode,
      batchSwaps: true,
      limitOrders: !this.isDemoMode,
      apiKey: !!this.apiKey,
      demoMode: this.isDemoMode,
      network: 'Base',
      chainId: BASE_CHAIN_ID,
    };
  }

  // ==================== DEMO MODE METHODS ====================

  private getDemoQuote(params: {
    fromTokenAddress: string;
    toTokenAddress: string;
    amount: string;
    walletAddress: string;
  }): SwapQuote {
    const amountInWei = BigInt(Math.floor(parseFloat(params.amount) * Math.pow(10, 18)));
    let toAmount: bigint;

    if (
      params.fromTokenAddress.toLowerCase() === ETH_ADDRESS.toLowerCase() &&
      params.toTokenAddress === '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
    ) {
      toAmount = (amountInWei * BigInt(3000)) / BigInt(1e12);
    } else if (
      params.fromTokenAddress === '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' &&
      params.toTokenAddress.toLowerCase() === ETH_ADDRESS.toLowerCase()
    ) {
      toAmount = (amountInWei * BigInt(1e12)) / BigInt(3000);
    } else {
      toAmount = (amountInWei * BigInt(98)) / BigInt(100);
    }

    return {
      fromToken: {
        address: params.fromTokenAddress,
        symbol: 'FROM',
        decimals: 18,
        name: 'From Token',
        chainId: BASE_CHAIN_ID,
      },
      toToken: {
        address: params.toTokenAddress,
        symbol: 'TO',
        decimals: 18,
        name: 'To Token',
        chainId: BASE_CHAIN_ID,
      },
      fromAmount: params.amount,
      toAmount: toAmount.toString(),
      gas: '0',
      gasPrice: '0',
      protocols: [],
    };
  }

  private createDemoOrder(params: {
    fromTokenAddress: string;
    toTokenAddress: string;
    amount: string;
    walletAddress: string;
  }): FusionOrder {
    const quote = this.getDemoQuote(params);
    
    const orderHash = '0x' + 
      Math.random().toString(16).substring(2, 66).padEnd(64, '0');
    
    console.log('🎭 Demo Fusion Order created:');
    console.log(`   Order Hash: ${orderHash.substring(0, 20)}...`);
    console.log(`   From: ${params.fromTokenAddress.substring(0, 10)}...`);
    console.log(`   To: ${params.toTokenAddress.substring(0, 10)}...`);
    console.log(`   Amount: ${params.amount}`);
    console.log('💡 In real mode, wallet signature would be requested!');

    return {
      orderHash,
      status: OrderStatus.Pending,
      fromToken: params.fromTokenAddress,
      toToken: params.toTokenAddress,
      fromAmount: params.amount,
      toAmount: quote.toAmount,
      maker: params.walletAddress,
      createTimestamp: Date.now(),
    };
  }
}

export const fusionService = new OneInchFusionService();
