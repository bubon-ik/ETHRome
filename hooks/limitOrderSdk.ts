import { MakerTraits, Address, Sdk, randBigInt, FetchProviderConnector } from "@1inch/limit-order-sdk"

export async function submitLimitOrder(order: any, signature: string) {
    const sdk = new Sdk({ authKey: process.env.NEXT_PUBLIC_ONEINCH_API_KEY || '',baseUrl: "https://1inch-vercel-proxy-theta.vercel.app/orderbook/v4.1", networkId: 8453, httpConnector: new FetchProviderConnector() });

    await sdk.submitOrder(order, signature);
}
