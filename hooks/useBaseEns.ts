import { useEnsName, useEnsAddress } from 'wagmi';
import { base } from 'wagmi/chains';

// Hook for resolving ENS addresses on Base network
export function useBaseEnsAddress(name: string | undefined) {
    return useEnsAddress({
        name: name && name.endsWith('.eth') ? name : undefined,
        chainId: base.id,
        query: {
            enabled: !!name && name.endsWith('.eth'),
        }
    });
}

// Hook for resolving ENS names on Base network
export function useBaseEnsName(address: `0x${string}` | undefined) {
    return useEnsName({
        address: address || undefined,
        chainId: base.id,
    });
}
