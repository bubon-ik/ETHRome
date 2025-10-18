import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    const { chain } = req.query;
    const apiKey = process.env.ONEINCH_API_KEY || process.env.NEXT_PUBLIC_ONEINCH_API_KEY || '';

    try {
        console.log('Submitting limit order:', {
            chain,
            hasApiKey: !!apiKey && apiKey !== 'your_1inch_api_key',
            orderHash: req.body.orderHash?.slice(0, 10),
            data: req.body.data,
        });

        const headers: Record<string, string> = { 'Content-Type': 'application/json' };

        if (apiKey && apiKey !== 'your_1inch_api_key') {
            headers['Authorization'] = `Bearer ${apiKey}`;
        }

        const response = await fetch(`https://api.1inch.com/orderbook/v4.1/${chain}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(req.body),
        });

        const text = await response.text();

        console.log('1inch response:', {
            status: response.status,
            body: text.slice(0, 300),
        });

        let data;
        try {
            data = JSON.parse(text);
        } catch {
            data = { raw: text };
        }

        res.status(response.status).json(data);
    } catch (err: any) {
        console.error('Limit order error:', err);
        res.status(502).json({
            error: 'Failed to submit order',
            message: err?.message || String(err)
        });
    }
}
