import { useAccount, useBalance, useReadContract } from 'wagmi';
import { useEffect, useMemo, useState } from 'react';
import type { Token } from '@/types';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;

const ERC20_ABI = [
  {
    type: 'function',
    stateMutability: 'view',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
] as const;

export function useTokenBalance(token: Token | null) {
  const { address } = useAccount();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isNative = token?.address.toLowerCase() === ZERO_ADDRESS;

  // Native balance via wagmi
  const native = useBalance({
    address: address,
    query: {
      enabled: mounted && Boolean(address) && Boolean(isNative),
    },
  });

  // ERC20 balance via readContract
  const erc20 = useReadContract({
    abi: ERC20_ABI,
    address: (isNative ? undefined : (token?.address as `0x${string}`))!,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: mounted && Boolean(address) && Boolean(token && !isNative),
    },
  });

  const { formatted, value, isLoading, error } = useMemo(() => {
    if (!mounted || !token) return { formatted: '0.00', value: null, isLoading: false, error: null as any };

    if (isNative) {
      const v = native.data?.value ?? null;
      const d = native.data?.decimals ?? token.decimals ?? 18;
      const num = v ? Number(v) / 10 ** d : 0;
      return {
        formatted: num.toLocaleString(undefined, { maximumFractionDigits: 4 }),
        value: v ?? null,
        isLoading: native.isLoading,
        error: native.error ?? null,
      };
    }

    const v = (erc20.data as bigint | undefined) ?? null;
    const d = token.decimals ?? 18;
    const num = v ? Number(v) / 10 ** d : 0;
    return {
      formatted: num.toLocaleString(undefined, { maximumFractionDigits: 4 }),
      value: v,
      isLoading: erc20.isLoading,
      error: erc20.error ?? null,
    };
  }, [mounted, token, isNative, native.data, native.isLoading, native.error, erc20.data, erc20.isLoading, erc20.error]);

  return { formatted, value, isLoading, error };
}


