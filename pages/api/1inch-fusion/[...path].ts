/**
 * Next.js API route для проксирования запросов к 1inch Fusion API
 * Обходит CORS ограничения для разработки
 */

import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Разрешаем CORS для всех origins в development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Обрабатываем preflight запросы
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { method, url, body, headers } = req;
    
    // Извлекаем путь из URL
    const apiPath = url?.replace('/api/1inch-fusion/', '') || '';
    
    // Формируем URL для 1inch API с API ключом в query параметрах
    const apiKey = process.env.NEXT_PUBLIC_ONEINCH_API_KEY;
    const separator = apiPath.includes('?') ? '&' : '?';
    const targetUrl = `https://api.1inch.dev/fusion/${apiPath}${separator}apikey=${apiKey}`;
    
    console.log('🔄 Proxying request to:', targetUrl);
    console.log('📝 Method:', method);
    console.log('📝 Body:', body);
    console.log('📝 Headers from client:', headers);
    console.log('🔑 API Key present:', !!process.env.NEXT_PUBLIC_ONEINCH_API_KEY);
    console.log('🔑 API Key length:', process.env.NEXT_PUBLIC_ONEINCH_API_KEY?.length || 0);

    // Делаем запрос к 1inch API
    const response = await fetch(targetUrl, {
      method: method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ONEINCH_API_KEY}`,
        'X-API-Key': process.env.NEXT_PUBLIC_ONEINCH_API_KEY || '',
        'apikey': process.env.NEXT_PUBLIC_ONEINCH_API_KEY || '', // Альтернативный заголовок
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      console.error('❌ 1inch API error:', response.status, response.statusText);
      return res.status(response.status).json({
        error: '1inch API error',
        status: response.status,
        statusText: response.statusText,
      });
    }

    const data = await response.json();
    console.log('✅ 1inch API response:', data);

    res.status(200).json(data);
  } catch (error) {
    console.error('❌ Proxy error:', error);
    res.status(500).json({
      error: 'Proxy error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
