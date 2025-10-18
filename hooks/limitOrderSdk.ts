import { MakerTraits, Address, Sdk, randBigInt, FetchProviderConnector } from "@1inch/limit-order-sdk"

export async function submitLimitOrder(order: any, signature: string) {
    const sdk = new Sdk({ authKey: process.env.NEXT_PUBLIC_ONEINCH_API_KEY || '', networkId: 8453, httpConnector: new FetchProviderConnector() });

    await sdk.submitOrder(order, signature);
}
