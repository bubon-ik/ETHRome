export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  chainId: number;
}

export interface SwapToken extends Token {
  amount: string;
  value?: string;
}

export interface SwapRoute {
  from: SwapToken;
  to: SwapToken;
  route?: any;
  gas?: string;
  gasPrice?: string;
}

export interface BatchSwapParams {
  routes: SwapRoute[];
  recipient: string;
  deadline?: number;
  slippage?: number;
}

export interface LimitOrder {
  id: string;
  maker: string;
  token: Token;
  amount: string;
  targetToken: Token;
  targetAmount: string;
  deadline: number;
  status: 'pending' | 'filled' | 'cancelled' | 'expired';
  createdAt: number;
}

export interface SwapQuote {
  fromToken: Token;
  toToken: Token;
  fromAmount: string;
  toAmount: string;
  gas: string;
  gasPrice: string;
  protocols?: any[];
  tx?: {
    to: string;
    data: string;
    value: string;
    gas: string;
    gasPrice: string;
  };
}

export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}



