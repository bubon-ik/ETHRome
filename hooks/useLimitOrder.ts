import { useAccount, useSwitchChain } from 'wagmi';
import { useState } from 'react';
import { parseUnits, erc20Abi } from 'viem';
import { readContract, signTypedData, waitForTransactionReceipt, writeContract } from '@wagmi/core';
import { config } from '@/lib/wagmi';
import { base } from 'wagmi/chains';
import { submitLimitOrder } from './limitOrderSdk';
import { MakerTraits, Address, Sdk, randBigInt, FetchProviderConnector } from '@1inch/limit-order-sdk';

const CHAIN_ID = 8453;
const LIMIT_ORDER_CONTRACT: `0x${string}` = '0x111111125421cA6dc452d289314280a0f8842A65';

export const useLimitOrder = () => {
    const { address, isConnected, chainId } = useAccount();
    const { switchChain } = useSwitchChain();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const ensureAllowance = async (tokenAddress: string, requiredAmount: bigint) => {
        if (!address) return;

        const formattedToken = tokenAddress as `0x${string}`;
        const owner = address as `0x${string}`;

        const currentAllowance = (await readContract(config, {
            address: formattedToken,
            abi: erc20Abi,
            functionName: 'allowance',
            args: [owner, LIMIT_ORDER_CONTRACT],
        })) as bigint;

        if (currentAllowance >= requiredAmount) {
            return;
        }

        const hash = await writeContract(config, {
            address: formattedToken,
            abi: erc20Abi,
            functionName: 'approve',
            args: [LIMIT_ORDER_CONTRACT, requiredAmount],
        });

        await waitForTransactionReceipt(config, { hash });
    };

    const createLimitOrder = async (
        tokenIn: string,
        tokenOut: string,
        amountIn: string,
        amountOut: string,
        decimalsIn: number,
        decimalsOut?: number,
    ) => {
        if (!address || !isConnected) {
            setError('Wallet not connected');
            return;
        }

        if (chainId !== CHAIN_ID) {
            try {
                await switchChain({ chainId: base.id });
            } catch (err) {
                setError('Please switch to Base network');
                return;
            }
        }

        try {
            setLoading(true);
            setError(null);

            const WETH_BASE = '0x4200000000000000000000000000000000000006';
            const ETH_ADDRESS = '0x0000000000000000000000000000000000000000';

            const makerAsset = tokenIn === ETH_ADDRESS ? WETH_BASE : tokenIn;
            const takerAsset = tokenOut === ETH_ADDRESS ? WETH_BASE : tokenOut;

            const makingAmount = parseUnits(amountIn, decimalsIn);
            const takingAmount = parseUnits(amountOut, decimalsOut || 18);

            await ensureAllowance(makerAsset, makingAmount);

            const sdk = new Sdk({
                networkId: CHAIN_ID,
                baseUrl: "https://1inch-vercel-proxy-theta.vercel.app/orderbook/v4.1",
                authKey: process.env.NEXT_PUBLIC_ONEINCH_API_KEY || '',
                httpConnector: new FetchProviderConnector(),
            });

            const makerTraits = MakerTraits.default()
                .withAnySender()
                .allowPartialFills()
                .allowMultipleFills()
                .withExpiration(BigInt(Math.floor(Date.now() / 1000) + 3600))
                .withNonce(randBigInt((BigInt(1) << BigInt(40)) - BigInt(1)));

            const order = await sdk.createOrder({
                maker: new Address(address),
                makerAsset: new Address(makerAsset),
                takerAsset: new Address(takerAsset),
                makingAmount,
                takingAmount,
            }, makerTraits);


            const typedData = order.getTypedData(CHAIN_ID);

            const signature = await signTypedData(config, {
                account: address,
                types: typedData.types,
                primaryType: typedData.primaryType,
                domain: typedData.domain,
                message: typedData.message,
            });

            await submitLimitOrder(order, signature);


        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { createLimitOrder, loading, error };
};
