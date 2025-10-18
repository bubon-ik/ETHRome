import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getWagmiConfig } from '@/lib/wagmi';

// Create QueryClient once to prevent multiple instances
let queryClient: QueryClient | null = null;

const getQueryClient = () => {
  if (!queryClient) {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: false,
          retry: false,
        },
      },
    });
  }
  return queryClient;
};

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WagmiProvider config={getWagmiConfig()}>
      <QueryClientProvider client={getQueryClient()}>
        <Component {...pageProps} />
      </QueryClientProvider>
    </WagmiProvider>
  );
}
