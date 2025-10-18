import { SwapQuote, Token } from '@/types';
import { parseUnits, encodeFunctionData, erc20Abi, type Address } from 'viem';

const ONEINCH_API_URL = '/api/1inch';
const BASE_CHAIN_ID = 8453; // Base mainnet
const ONEINCH_ROUTER = '0x1111111254EEB25477B68fb85Ed929f73A960582';
const ETH_ADDRESS = '0x0000000000000000000000000000000000000000';
const ETH_ADDRESS_1INCH = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

export interface SwapParams {
    fromToken: Token;
    toToken: Token;
    amount: string;
    walletAddress: string;
    recipient?: string;
    slippage?: number;
    permit?: string;
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

        console.log('SimpleSwapService initialized:');
        console.log('  API Key:', apiKey ? `${apiKey.substring(0, 8)}...` : 'NOT SET');
        console.log('  Demo Mode:', this.isDemoMode);
    }

    private normalizeTokenAddress(address: string): string {
        if (address.toLowerCase() === ETH_ADDRESS.toLowerCase()) {
            return ETH_ADDRESS_1INCH;
        }
        return address;
    }

    async getQuote(params: SwapParams): Promise<SwapQuote> {
        if (this.isDemoMode) {
            return this.getDemoQuote(params);
        }
        if (typeof window === 'undefined') {
            return this.getDemoQuote(params);
        }
        try {
            const url = new URL(`${ONEINCH_API_URL}/swap/v5.0/${BASE_CHAIN_ID}/quote`, window.location.origin);
            url.searchParams.append('src', this.normalizeTokenAddress(params.fromToken.address));
            url.searchParams.append('dst', this.normalizeTokenAddress(params.toToken.address));
            url.searchParams.append('amount', parseUnits(params.amount, params.fromToken.decimals).toString());

            console.log('Getting quote from:', url.toString());

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'accept': 'application/json',
                },
            });
            if (!response.ok) {
                const errorText = await response.text();
                if (response.status === 429) {
                    console.warn('Rate limit exceeded, please slow down requests');
                    throw new Error('Rate limit exceeded. Please wait a moment and try again.');
                }
                console.error('API Error:', response.status, errorText);
                throw new Error(`1inch API error: ${response.status} - ${errorText}`);
            }
            const data = await response.json();
            console.log('Quote received:', data);
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

    async getBatchSwapTransaction(params: SwapParams & { slippage?: number }): Promise<SwapTransaction> {
        console.log('Getting real batch swap transaction from 1inch API');
        try {
            const url = new URL(`${ONEINCH_API_URL}/swap/v5.0/${BASE_CHAIN_ID}/swap`, window.location.origin);
            url.searchParams.append('src', this.normalizeTokenAddress(params.fromToken.address));
            url.searchParams.append('dst', this.normalizeTokenAddress(params.toToken.address));
            url.searchParams.append('amount', parseUnits(params.amount, params.fromToken.decimals).toString());
            url.searchParams.append('from', params.walletAddress);
            url.searchParams.append('slippage', (params.slippage || 1).toString());
            url.searchParams.append('disableEstimate', 'true');
            if (params.recipient && params.recipient.toLowerCase() !== params.walletAddress.toLowerCase()) {
                url.searchParams.append('destReceiver', params.recipient);
                console.log('Using custom recipient address in batch swap:', params.recipient);
            }
            if (params.permit) {
                url.searchParams.append('permit', params.permit);
                console.log('Using permit data for gas optimization');
            }
            console.log('Batch swap URL:', url.toString());
            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'accept': 'application/json',
                },
            });
            if (!response.ok) {
                const errorText = await response.text();
                console.error('1inch API Error:', response.status, errorText);
                throw new Error(`1inch API error: ${response.status} - ${errorText}`);
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
            console.error('Failed to get batch swap transaction:', error);
            throw error;
        }
    }

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
            if (params.recipient && params.recipient.toLowerCase() !== params.walletAddress.toLowerCase()) {
                url.searchParams.append('destReceiver', params.recipient);
                console.log('Using custom recipient address:', params.recipient);
            }
            if (params.permit) {
                url.searchParams.append('permit', params.permit);
                console.log('Using permit data for gas optimization');
            }
            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'accept': 'application/json',
                },
            });
            if (!response.ok) {
                const errorText = await response.text();
                console.error('1inch API Error:', response.status, errorText);
                throw new Error(`1inch API error: ${response.status} - ${errorText}`);
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
                const errorText = await response.text();
                console.error('1inch API Error:', response.status, errorText);
                throw new Error(`1inch API error: ${response.status} - ${errorText}`);
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

    async getAllowance(tokenAddress: string, walletAddress: string): Promise<string> {
        if (this.isDemoMode) {
            return '0';
        }
        try {
            const spender = await this.getSpender();
            const url = new URL(`${ONEINCH_API_URL}/swap/v5.2/${BASE_CHAIN_ID}/approve/allowance`, window.location.origin);
            url.searchParams.append('tokenAddress', tokenAddress);
            url.searchParams.append('walletAddress', walletAddress);
            url.searchParams.append('spenderAddress', spender);
            const response = await fetch(url.toString());
            if (!response.ok) {
                const errorText = await response.text();
                console.error('1inch API Error:', response.status, errorText);
                throw new Error(`1inch API error: ${response.status} - ${errorText}`);
            }
            const data = await response.json();
            return data.allowance;
        } catch (error) {
            console.error('Failed to get allowance:', error);
            return '0';
        }
    }

    async getSpender(): Promise<string> {
        if (this.isDemoMode) {
            return ONEINCH_ROUTER;
        }
        try {
            const response = await fetch(`${window.location.origin}${ONEINCH_API_URL}/swap/v5.2/${BASE_CHAIN_ID}/approve/spender`);
            if (!response.ok) {
                const errorText = await response.text();
                console.error('1inch API Error:', response.status, errorText);
                throw new Error(`1inch API error: ${response.status} - ${errorText}`);
            }
            const data = await response.json();
            return data.address;
        } catch (error) {
            console.error('Failed to get spender:', error);
            return ONEINCH_ROUTER;
        }
    }

    async prepareSingleSwapCall(params: SwapParams): Promise<BatchSwapCall[]> {
        const calls: BatchSwapCall[] = [];
        if (this.isNativeToken(params.fromToken.address)) {
            const swapTx = await this.getSwapTransaction(params);
            calls.push({
                to: swapTx.to,
                data: swapTx.data,
                value: swapTx.value,
            });
            return calls;
        }
        const allowance = await this.getAllowance(params.fromToken.address, params.walletAddress);
        const requiredAmount = parseUnits(params.amount, params.fromToken.decimals);
        if (BigInt(allowance) < requiredAmount) {
            console.log(`Adding approve for ${params.fromToken.address}: ${requiredAmount.toString()}`);
            console.log(`   Current allowance: ${allowance}, Required: ${requiredAmount.toString()}`);
            const approveTx = await this.getApproveTransaction(
                params.fromToken.address,
                params.amount,
                params.fromToken.decimals
            );
            calls.push({
                to: approveTx.to,
                data: approveTx.data,
                value: approveTx.value,
            });
        } else {
            console.log(`Sufficient allowance for ${params.fromToken.address}: ${allowance}`);
        }
        const swapTx = await this.getBatchSwapTransaction(params);
        calls.push({
            to: swapTx.to,
            data: swapTx.data,
            value: swapTx.value,
        });
        console.log(`Prepared ${calls.length} calls for single swap`);
        return calls;
    }

    async prepareBatchSwapCalls(params: {
        swaps: SwapParams[];
        walletAddress: string;
        slippage?: number;
    }): Promise<BatchSwapCall[]> {
        const calls: BatchSwapCall[] = [];
        const tokenApprovals = new Map<string, bigint>();
        for (const swap of params.swaps) {
            if (!this.isNativeToken(swap.fromToken.address)) {
                const amount = parseUnits(swap.amount, swap.fromToken.decimals);
                const currentMax = tokenApprovals.get(swap.fromToken.address) || BigInt(0);
                if (amount > currentMax) {
                    tokenApprovals.set(swap.fromToken.address, amount);
                }
            }
        }
        for (const tokenApprovalEntry of Array.from(tokenApprovals.entries())) {
            const [tokenAddress, amount] = tokenApprovalEntry;
            const allowance = await this.getAllowance(tokenAddress, params.walletAddress);
            if (BigInt(allowance) < amount) {
                console.log(`Adding approve for ${tokenAddress}: ${amount.toString()}`);
                const tokenDecimals = params.swaps.find(swap =>
                    swap.fromToken.address.toLowerCase() === tokenAddress.toLowerCase()
                )?.fromToken.decimals || 18;
                const approveTx = await this.getApproveTransaction(
                    tokenAddress,
                    amount.toString(),
                    tokenDecimals
                );
                calls.push({
                    to: approveTx.to,
                    data: approveTx.data,
                    value: approveTx.value,
                });
            }
        }
        for (const swap of params.swaps) {
            const swapTx = await this.getBatchSwapTransaction({
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
        console.log(`Prepared ${calls.length} calls: ${tokenApprovals.size} approves + ${params.swaps.length} swaps`);
        return calls;
    }

    private isNativeToken(address: string): boolean {
        return address.toLowerCase() === ETH_ADDRESS.toLowerCase();
    }

    private async generatePermitData(
        tokenAddress: string,
        amount: string,
        walletAddress: string
    ): Promise<string | undefined> {
        try {
            const spender = await this.getSpender();
            const amountInWei = parseUnits(amount, 18);
            if (this.isDemoMode) {
                return undefined;
            }
            console.log('Generating permit data for:', tokenAddress);
            console.log('   Amount:', amountInWei.toString());
            console.log('   Spender:', spender);
            return undefined;
        } catch (error) {
            console.error('Failed to generate permit data:', error);
            return undefined;
        }
    }

    private getDemoQuote(params: SwapParams): SwapQuote {
        const amountInWei = BigInt(parseUnits(params.amount, params.fromToken.decimals).toString());
        let toAmount: bigint;
        if (
            params.fromToken.address.toLowerCase() === ETH_ADDRESS.toLowerCase() &&
            params.toToken.address === '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
        ) {
            toAmount = (amountInWei * BigInt(3000)) / BigInt(1e12);
        } else if (
            params.fromToken.address === '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' &&
            params.toToken.address.toLowerCase() === ETH_ADDRESS.toLowerCase()
        ) {
            toAmount = (amountInWei * BigInt(1e12)) / BigInt(3000);
        } else {
            toAmount = (amountInWei * BigInt(98)) / BigInt(100);
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
        if (params.recipient && params.recipient.toLowerCase() !== params.walletAddress.toLowerCase()) {
            console.log('DEMO MODE: Using custom recipient address:', params.recipient);
        }
        return {
            to: ONEINCH_ROUTER as Address,
            data: '0x12aa3caf' as `0x${string}`,
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
