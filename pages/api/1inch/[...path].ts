import type { NextApiRequest, NextApiResponse } from 'next';

const ONEINCH_BASE = 'https://api.1inch.dev'; // Base URL for all 1inch API services

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { path = [] } = req.query as { path: string[] };
    const apiKey = process.env.ONEINCH_API_KEY || process.env.NEXT_PUBLIC_ONEINCH_API_KEY || '';
    const pathString = path.join('/');

    // Determine which 1inch API to use based on the path
    let urlString = '';

    // Handle specific endpoints correctly
    if (pathString.startsWith('swap/')) {
        const swapPath = pathString.replace(/^swap\//, '');
        urlString = `${ONEINCH_BASE}/swap/${swapPath}`;
    } else if (pathString.startsWith('orderbook/')) {
        const orderPath = pathString.replace(/^orderbook\//, '');
        urlString = `${ONEINCH_BASE}/orderbook/${orderPath}`;
    } else {
        // Default case - just pass the path as is
        urlString = `${ONEINCH_BASE}/${pathString}`;
    }

    const url = new URL(urlString);

    // Attach query params
    Object.entries(req.query).forEach(([key, value]) => {
        if (key === 'path') return;
        if (Array.isArray(value)) {
            value.forEach((v) => url.searchParams.append(key, String(v)));
        } else if (value !== undefined) {
            url.searchParams.append(key, String(value));
        }
    });

    const headers: Record<string, string> = { accept: 'application/json' };

    // Добавляем API ключ для всех эндпоинтов, которые его поддерживают
    //   const pathString = path.join('/');
    const supportsAuth = pathString.includes('orderbook') || pathString.includes('v6.0') ||
        pathString.includes('swap') || pathString.includes('quote');

    if (supportsAuth && apiKey && apiKey !== 'your_1inch_api_key') {
        headers['Authorization'] = `Bearer ${apiKey}`;
        console.log('🔑 Adding API key to request:', pathString);
    } else if (supportsAuth) {
        console.log('⚠️ No API key for request:', pathString);
    }
    // const headers: Record<string, string> = { accept: 'application/json' };

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
