// all errors from main page process here

import { SwapQuote, Token } from '@/types';
import { parseUnits, encodeFunctionData, erc20Abi, type Address } from 'viem';

const ONEINCH_API_URL = '/api/1inch';
const BASE_CHAIN_ID = 8453; // Base mainnet
const ONEINCH_ROUTER = '0x1111111254EEB25477B68fb85Ed929f73A960582';
const ETH_ADDRESS = '0x0000000000000000000000000000000000000000';
const ETH_ADDRESS_1INCH = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

type Result<T> = { data: T; error: null } | { data: null; error: string };

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

    async getQuote(params: SwapParams): Promise<Result<SwapQuote>> {
        if (this.isDemoMode) {
            return { data: this.getDemoQuote(params), error: null };
        }
        if (typeof window === 'undefined') {
            return { data: this.getDemoQuote(params), error: null };
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
                    return { data: null, error: 'Rate limit exceeded. Please wait a moment and try again.' };
                }
                console.error('API Error:', response.status, errorText);
                let errorMessage = `1inch API error: ${response.status} - ${errorText}`;
                try {
                    const errorJson = JSON.parse(errorText);
                    if (errorJson.description) {
                        errorMessage = errorJson.description;
                    }
                } catch (e) {
                    // Keep the full error if parsing fails
                }
                return { data: null, error: errorMessage };
            }
            const data = await response.json();
            console.log('Quote received:', data);
            return {
                data: {
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
                },
                error: null
            };
        } catch (error) {
            console.error('Failed to get quote:', error);
            return { data: this.getDemoQuote(params), error: null };
        }
    }

    async getBatchSwapTransaction(params: SwapParams & { slippage?: number }): Promise<Result<SwapTransaction>> {
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
                let errorMessage = `1inch API error: ${response.status} - ${errorText}`;
                try {
                    const errorJson = JSON.parse(errorText);
                    if (errorJson.description) {
                        errorMessage = errorJson.description;
                    }
                } catch (e) {
                    // Keep the full error if parsing fails
                }
                return { data: null, error: errorMessage };
            }
            const data = await response.json();
            return {
                data: {
                    to: data.tx.to as Address,
                    data: data.tx.data as `0x${string}`,
                    value: BigInt(data.tx.value || '0'),
                    gas: data.tx.gas,
                    gasPrice: data.tx.gasPrice,
                },
                error: null
            };
        } catch (error) {
            console.error('Failed to get batch swap transaction:', error);
            return { data: null, error: 'Failed to get batch swap transaction' };
        }
    }

    async getSwapTransaction(params: SwapParams & { slippage?: number }): Promise<Result<SwapTransaction>> {
        if (this.isDemoMode) {
            return { data: this.getDemoSwapTransaction(params), error: null };
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
                let errorMessage = `1inch API error: ${response.status} - ${errorText}`;
                try {
                    const errorJson = JSON.parse(errorText);
                    if (errorJson.description) {
                        errorMessage = errorJson.description;
                    }
                } catch (e) {
                    // Keep the full error if parsing fails
                }
                return { data: null, error: errorMessage };
            }
            const data = await response.json();
            return {
                data: {
                    to: data.tx.to as Address,
                    data: data.tx.data as `0x${string}`,
                    value: BigInt(data.tx.value || '0'),
                    gas: data.tx.gas,
                    gasPrice: data.tx.gasPrice,
                },
                error: null
            };
        } catch (error) {
            console.error('Failed to get swap transaction:', error);
            return { data: this.getDemoSwapTransaction(params), error: null };
        }
    }

    async getApproveTransaction(
        tokenAddress: string,
        amount: string,
        decimals: number = 18
    ): Promise<Result<SwapTransaction>> {
        if (this.isDemoMode) {
            return { data: this.getDemoApproveTransaction(tokenAddress, amount), error: null };
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
                let errorMessage = `1inch API error: ${response.status} - ${errorText}`;
                try {
                    const errorJson = JSON.parse(errorText);
                    if (errorJson.description) {
                        errorMessage = errorJson.description;
                    }
                } catch (e) {
                    // Keep the full error if parsing fails
                }
                return { data: null, error: errorMessage };
            }
            const data = await response.json();
            return {
                data: {
                    to: data.to as Address,
                    data: data.data as `0x${string}`,
                    value: BigInt(data.value || '0'),
                    gas: data.gas,
                    gasPrice: data.gasPrice,
                },
                error: null
            };
        } catch (error) {
            console.error('Failed to get approve transaction:', error);
            return { data: this.getDemoApproveTransaction(tokenAddress, amount), error: null };
        }
    }

    async getAllowance(tokenAddress: string, walletAddress: string): Promise<Result<string>> {
        if (this.isDemoMode) {
            return { data: '0', error: null };
        }
        try {
            const spender = await this.getSpender();
            if (spender.error) {
                return { data: null, error: spender.error };
            }
            const url = new URL(`${ONEINCH_API_URL}/swap/v5.2/${BASE_CHAIN_ID}/approve/allowance`, window.location.origin);
            url.searchParams.append('tokenAddress', tokenAddress);
            url.searchParams.append('walletAddress', walletAddress);
            url.searchParams.append('spenderAddress', spender.data!);
            const response = await fetch(url.toString());
            if (!response.ok) {
                const errorText = await response.text();
                console.error('1inch API Error:', response.status, errorText);
                return { data: null, error: `1inch API error: ${response.status} - ${errorText}` };
            }
            const data = await response.json();
            return { data: data.allowance, error: null };
        } catch (error) {
            console.error('Failed to get allowance:', error);
            return { data: '0', error: null };
        }
    }

    async getSpender(): Promise<Result<string>> {
        if (this.isDemoMode) {
            return { data: ONEINCH_ROUTER, error: null };
        }
        try {
            const response = await fetch(`${window.location.origin}${ONEINCH_API_URL}/swap/v5.2/${BASE_CHAIN_ID}/approve/spender`);
            if (!response.ok) {
                const errorText = await response.text();
                console.error('1inch API Error:', response.status, errorText);
                return { data: null, error: `1inch API error: ${response.status} - ${errorText}` };
            }
            const data = await response.json();
            return { data: data.address, error: null };
        } catch (error) {
            console.error('Failed to get spender:', error);
            return { data: ONEINCH_ROUTER, error: null };
        }
    }

    async prepareSingleSwapCall(params: SwapParams): Promise<Result<BatchSwapCall[]>> {
        const calls: BatchSwapCall[] = [];
        if (this.isNativeToken(params.fromToken.address)) {
            const swapTx = await this.getSwapTransaction(params);
            if (swapTx.error) {
                return { data: null, error: swapTx.error };
            }
            calls.push({
                to: swapTx.data!.to,
                data: swapTx.data!.data,
                value: swapTx.data!.value,
            });
            return { data: calls, error: null };
        }
        const allowanceResult = await this.getAllowance(params.fromToken.address, params.walletAddress);
        if (allowanceResult.error) {
            return { data: null, error: allowanceResult.error };
        }
        const allowance = allowanceResult.data!;
        const requiredAmount = parseUnits(params.amount, params.fromToken.decimals);
        if (BigInt(allowance) < requiredAmount) {
            console.log(`Adding approve for ${params.fromToken.address}: ${requiredAmount.toString()}`);
            console.log(`   Current allowance: ${allowance}, Required: ${requiredAmount.toString()}`);
            const approveTx = await this.getApproveTransaction(
                params.fromToken.address,
                params.amount,
                params.fromToken.decimals
            );
            if (approveTx.error) {
                return { data: null, error: approveTx.error };
            }
            calls.push({
                to: approveTx.data!.to,
                data: approveTx.data!.data,
                value: approveTx.data!.value,
            });
        } else {
            console.log(`Sufficient allowance for ${params.fromToken.address}: ${allowance}`);
        }
        const swapTx = await this.getBatchSwapTransaction(params);
        if (swapTx.error) {
            return { data: null, error: swapTx.error };
        }
        calls.push({
            to: swapTx.data!.to,
            data: swapTx.data!.data,
            value: swapTx.data!.value,
        });
        console.log(`Prepared ${calls.length} calls for single swap`);
        return { data: calls, error: null };
    }

    async prepareBatchSwapCalls(params: {
        swaps: SwapParams[];
        walletAddress: string;
        slippage?: number;
    }): Promise<Result<BatchSwapCall[]>> {
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
            const allowanceResult = await this.getAllowance(tokenAddress, params.walletAddress);
            if (allowanceResult.error) {
                return { data: null, error: allowanceResult.error };
            }
            const allowance = allowanceResult.data!;
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
                if (approveTx.error) {
                    return { data: null, error: approveTx.error };
                }
                calls.push({
                    to: approveTx.data!.to,
                    data: approveTx.data!.data,
                    value: approveTx.data!.value,
                });
            }
        }
        for (const swap of params.swaps) {
            const swapTx = await this.getBatchSwapTransaction({
                ...swap,
                walletAddress: params.walletAddress,
                slippage: params.slippage,
            });
            if (swapTx.error) {
                return { data: null, error: swapTx.error };
            }
            calls.push({
                to: swapTx.data!.to,
                data: swapTx.data!.data,
                value: swapTx.data!.value,
            });
        }
        console.log(`Prepared ${calls.length} calls: ${tokenApprovals.size} approves + ${params.swaps.length} swaps`);
        return { data: calls, error: null };
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
