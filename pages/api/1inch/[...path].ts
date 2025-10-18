import type { NextApiRequest, NextApiResponse } from 'next';

const ONEINCH_BASE = 'https://1inch-vercel-proxy-theta.vercel.app'; // REPLACED ON vercel
// const LIMIT_ORDERS_BASE = 'https://limit-orders-api.1inch.io';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { path = [] } = req.query as { path: string[] };
    const apiKey = process.env.ONEINCH_API_KEY || process.env.NEXT_PUBLIC_ONEINCH_API_KEY || '';
    const pathString = path.join('/');

    const isLimitOrdersEndpoint = pathString.startsWith('v1/');
    const baseUrl = isLimitOrdersEndpoint ? LIMIT_ORDERS_BASE : ONEINCH_BASE;
    const url = new URL(`${baseUrl}/${pathString}`);

    // Attach query params
    Object.entries(req.query).forEach(([key, value]) => {
        if (key === 'path') return;
        if (Array.isArray(value)) value.forEach((v) => url.searchParams.append(key, String(v)));
        else if (value !== undefined) url.searchParams.append(key, String(value));
    });

    const headers: Record<string, string> = { accept: 'application/json' };

    if (apiKey && apiKey !== 'your_1inch_api_key') {
        headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const init: RequestInit = {
        method: req.method,
        headers,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
        const body = req.body ?? {};
        init.body = typeof body === 'string' ? body : JSON.stringify(body);
        headers['content-type'] = 'application/json';
    }

    try {
        const upstream = await fetch(url.toString(), init);
        const text = await upstream.text();
        res.status(upstream.status);

        // Pass-through content-type
        const contentType = upstream.headers.get('content-type') || 'application/json; charset=utf-8';
        res.setHeader('content-type', contentType);

        res.send(text);
    } catch (err: any) {
        console.error('API Proxy Error:', {
            url: url.toString(),
            method: req.method,
            error: err?.message,
            stack: err?.stack,
        });
        res.status(502).json({
            error: 'Upstream fetch failed',
            message: err?.message || String(err),
            details: err?.code || err?.errno
        });
    }
}
