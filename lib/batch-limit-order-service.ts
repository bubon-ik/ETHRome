import { SwapQuote, Token } from '@/types';
import { 
  LimitOrder, 
  Api, 
  FetchProviderConnector, 
  Address,
  MakerTraits,
  Sdk,
  randBigInt
} from '@1inch/limit-order-sdk';
import { parseUnits, erc20Abi, encodeFunctionData } from 'viem';
import { readContract } from '@wagmi/core';
import { config } from '@/lib/wagmi';

const BASE_CHAIN_ID = 8453; // Base mainnet
const LIMIT_ORDER_CONTRACT: `0x${string}` = '0x111111125421cA6dc452d289314280a0f8842A65';
const WETH_BASE = '0x4200000000000000000000000000000000000006';
const ETH_ADDRESS = '0x0000000000000000000000000000000000000000';

export interface BatchLimitOrderCall {
  to: `0x${string}`;
  data: `0x${string}`;
  value: bigint;
}

export interface LimitOrderParams {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  decimalsIn: number;
  decimalsOut?: number;
  maker: string;
}

export interface BatchLimitOrderResult {
  orderHashes: string[];
  calls: BatchLimitOrderCall[];
  orders: LimitOrder[];
}

export class BatchLimitOrderService {
  private static instance: BatchLimitOrderService | null = null;
  private sdk: Sdk | null = null;
  private isDemoMode: boolean = true;
  private isInitialized: boolean = false;

  private constructor() {
    // Private constructor to prevent direct instantiation
  }

  public static getInstance(): BatchLimitOrderService {
    if (!BatchLimitOrderService.instance) {
      BatchLimitOrderService.instance = new BatchLimitOrderService();
      BatchLimitOrderService.instance.initializeSDK();
    }
    return BatchLimitOrderService.instance;
  }

  private initializeSDK() {
    if (this.isInitialized) {
      return;
    }
    
    try {
      const apiKey = process.env.NEXT_PUBLIC_ONEINCH_API_KEY;
      
      if (apiKey) {
        this.sdk = new Sdk({
          networkId: BASE_CHAIN_ID,
          baseUrl: "https://1inch-vercel-proxy-theta.vercel.app/orderbook/v4.1",
          authKey: apiKey,
          httpConnector: new FetchProviderConnector()
        });
        
        this.isDemoMode = false;
        console.log('Batch Limit Order Service initialized with API key!');
      } else {
        this.isDemoMode = true;
        this.sdk = null;
        console.log('Batch Limit Order Service in demo mode - API key required for full functionality');
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.warn('Failed to initialize Batch Limit Order Service, using demo mode:', error);
      this.isDemoMode = true;
      this.sdk = null;
      this.isInitialized = true;
    }
  }

  private normalizeTokenAddress(address: string): string {
    if (address.toLowerCase() === ETH_ADDRESS.toLowerCase()) {
      return WETH_BASE;
    }
    return address;
  }

  private async checkAllowance(tokenAddress: string, walletAddress: string, amount: bigint): Promise<boolean> {
    try {
      const currentAllowance = (await readContract(config, {
        address: tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [walletAddress as `0x${string}`, LIMIT_ORDER_CONTRACT],
      })) as bigint;

      return currentAllowance >= amount;
    } catch (error) {
      console.error('Error checking allowance:', error);
      return false;
    }
  }

  private createApproveCall(tokenAddress: string, amount: bigint): BatchLimitOrderCall {
    return {
      to: tokenAddress as `0x${string}`,
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: 'approve',
        args: [LIMIT_ORDER_CONTRACT, amount],
      }),
      value: BigInt(0),
    };
  }

  private async createLimitOrder(params: LimitOrderParams): Promise<{ order: LimitOrder; orderHash: string }> {
    if (this.isDemoMode || !this.sdk) {
      throw new Error('Limit orders require API key. Get one at https://portal.1inch.dev/');
    }

    const makerAsset = this.normalizeTokenAddress(params.tokenIn);
    const takerAsset = this.normalizeTokenAddress(params.tokenOut);

    const makingAmount = parseUnits(params.amountIn, params.decimalsIn);
    const takingAmount = parseUnits(params.amountOut, params.decimalsOut || 18);

    // Create maker traits
    const makerTraits = MakerTraits.default()
      .withAnySender()
      .allowPartialFills()
      .allowMultipleFills()
      .withExpiration(BigInt(Math.floor(Date.now() / 1000) + 3600))
      .withNonce(randBigInt((BigInt(1) << BigInt(40)) - BigInt(1)));

    // Create order
    const order = await this.sdk.createOrder({
      maker: new Address(params.maker),
      makerAsset: new Address(makerAsset),
      takerAsset: new Address(takerAsset),
      makingAmount,
      takingAmount,
    }, makerTraits);

    const orderHash = order.getOrderHash(BASE_CHAIN_ID);

    return { order, orderHash };
  }

  async prepareBatchLimitOrderCalls(params: {
    orders: LimitOrderParams[];
    walletAddress: string;
  }): Promise<{ calls: BatchLimitOrderCall[]; orderHashes: string[]; orders: LimitOrder[] }> {
    const calls: BatchLimitOrderCall[] = [];
    const orderHashes: string[] = [];
    const orders: LimitOrder[] = [];
    const tokenApprovals = new Map<string, bigint>();

    // Collect all required approvals
    for (const order of params.orders) {
      const makerAsset = this.normalizeTokenAddress(order.tokenIn);
      
      if (makerAsset !== WETH_BASE) { // Skip ETH/WETH approvals
        const amount = parseUnits(order.amountIn, order.decimalsIn);
        const currentMax = tokenApprovals.get(makerAsset) || BigInt(0);
        if (amount > currentMax) {
          tokenApprovals.set(makerAsset, amount);
        }
      }
    }

    // Check allowances and prepare approve calls
    for (const [tokenAddress, amount] of tokenApprovals.entries()) {
      const hasAllowance = await this.checkAllowance(tokenAddress, params.walletAddress, amount);
      if (!hasAllowance) {
        console.log(`Adding approve call for ${tokenAddress}: ${amount.toString()}`);
        calls.push(this.createApproveCall(tokenAddress, amount));
      }
    }

    // Create limit orders (these will be submitted to API, not blockchain)
    for (const order of params.orders) {
      try {
        const { order: limitOrder, orderHash } = await this.createLimitOrder(order);
        orders.push(limitOrder);
        orderHashes.push(orderHash);
      } catch (error) {
        console.error('Failed to create limit order:', error);
        throw new Error(`Failed to create limit order: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log(`Prepared ${calls.length} approve calls and ${orders.length} limit orders`);
    return { calls, orderHashes, orders };
  }

  async createLimitOrder(params: LimitOrderParams): Promise<{ order: LimitOrder; orderHash: string }> {
    if (this.isDemoMode || !this.sdk) {
      throw new Error('Limit orders require API key. Get one at https://portal.1inch.dev/');
    }

    const makerAsset = this.normalizeTokenAddress(params.tokenIn);
    const takerAsset = this.normalizeTokenAddress(params.tokenOut);

    const makingAmount = parseUnits(params.amountIn, params.decimalsIn);
    const takingAmount = parseUnits(params.amountOut, params.decimalsOut || 18);

    // Create maker traits
    const makerTraits = MakerTraits.default()
      .withAnySender()
      .allowPartialFills()
      .allowMultipleFills()
      .withExpiration(BigInt(Math.floor(Date.now() / 1000) + 3600))
      .withNonce(randBigInt((BigInt(1) << BigInt(40)) - BigInt(1)));

    // Create order
    const order = await this.sdk.createOrder({
      maker: new Address(params.maker),
      makerAsset: new Address(makerAsset),
      takerAsset: new Address(takerAsset),
      makingAmount,
      takingAmount,
    }, makerTraits);

    const orderHash = order.getOrderHash(BASE_CHAIN_ID);

    return { order, orderHash };
  }

  async submitLimitOrder(order: LimitOrder, signature: string): Promise<void> {
    if (this.isDemoMode || !this.sdk) {
      throw new Error('Limit orders require API key. Get one at https://portal.1inch.dev/');
    }

    await this.sdk.submitOrder(order, signature);
  }

  async submitBatchLimitOrders(orders: LimitOrder[], signatures: string[]): Promise<{ success: boolean; orderHashes: string[] }> {
    if (this.isDemoMode || !this.sdk) {
      throw new Error('Limit orders require API key. Get one at https://portal.1inch.dev/');
    }

    const orderHashes: string[] = [];

    try {
      for (let i = 0; i < orders.length; i++) {
        const order = orders[i];
        const signature = signatures[i];
        
        await this.sdk.submitOrder(order, signature);
        const orderHash = order.getOrderHash(BASE_CHAIN_ID);
        orderHashes.push(orderHash);
        
        console.log(`Submitted limit order ${i + 1}/${orders.length}: ${orderHash}`);
      }

      return { success: true, orderHashes };
    } catch (error) {
      console.error('Failed to submit batch limit orders:', error);
      throw error;
    }
  }

  async getLimitOrderQuote(params: {
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
    decimalsIn: number;
    decimalsOut?: number;
  }): Promise<SwapQuote> {
    // For quotes, we can use demo data or integrate with 1inch quote API
    const fromAmount = BigInt(params.amountIn);
    let toAmount: bigint;
    
    const tokenInNormalized = this.normalizeTokenAddress(params.tokenIn);
    const tokenOutNormalized = this.normalizeTokenAddress(params.tokenOut);
    
    // Demo pricing logic
    if (tokenInNormalized === WETH_BASE && tokenOutNormalized === '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913') {
      toAmount = fromAmount * BigInt(3000) / BigInt(1e12);
    } else if (tokenInNormalized === '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' && tokenOutNormalized === WETH_BASE) {
      toAmount = fromAmount * BigInt(1e12) / BigInt(3000);
    } else if (tokenInNormalized === WETH_BASE && tokenOutNormalized === WETH_BASE) {
      toAmount = fromAmount;
    } else {
      toAmount = fromAmount * BigInt(98) / BigInt(100); // 2% slippage
    }

    return {
      fromToken: { 
        address: params.tokenIn, 
        symbol: 'FROM', 
        decimals: params.decimalsIn, 
        name: 'From Token', 
        chainId: BASE_CHAIN_ID 
      },
      toToken: { 
        address: params.tokenOut, 
        symbol: 'TO', 
        decimals: params.decimalsOut || 18, 
        name: 'To Token', 
        chainId: BASE_CHAIN_ID 
      },
      fromAmount: params.amountIn,
      toAmount: toAmount.toString(),
      gas: '150000',
      gasPrice: '2000000000',
      protocols: [],
    };
  }

  getFeatures() {
    return {
      batchLimitOrders: !this.isDemoMode,
      approvals: true,
      quotes: true,
      demoMode: this.isDemoMode,
      hasApiKey: !!process.env.NEXT_PUBLIC_ONEINCH_API_KEY && process.env.NEXT_PUBLIC_ONEINCH_API_KEY !== 'your_1inch_api_key',
      network: 'Base',
      chainId: BASE_CHAIN_ID,
    };
  }
}

// Export singleton instance
export const batchLimitOrderService = BatchLimitOrderService.getInstance();
