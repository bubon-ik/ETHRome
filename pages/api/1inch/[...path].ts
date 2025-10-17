import type { NextApiRequest, NextApiResponse } from 'next';

const ONEINCH_BASE = 'https://api.1inch.dev';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { path = [] } = req.query as { path: string[] };
  const apiKey = process.env.NEXT_PUBLIC_ONEINCH_API_KEY || '';

  const url = new URL(`${ONEINCH_BASE}/${path.join('/')}`);

  // Attach query params
  Object.entries(req.query).forEach(([key, value]) => {
    if (key === 'path') return;
    if (Array.isArray(value)) value.forEach((v) => url.searchParams.append(key, String(v)));
    else if (value !== undefined) url.searchParams.append(key, String(value));
  });

  const headers: Record<string, string> = { accept: 'application/json' };
  
  // Добавляем API ключ только для эндпоинтов, которые его требуют (limit orders)
  const pathString = path.join('/');
  const requiresAuth = pathString.includes('orderbook') || pathString.includes('v6.0');
  
  if (requiresAuth && apiKey && apiKey !== 'your_1inch_api_key') {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const init: RequestInit = {
    method: req.method,
    headers,
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = JSON.stringify(req.body ?? {});
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
    res.status(502).json({ error: 'Upstream fetch failed', message: err?.message || String(err) });
  }
}
