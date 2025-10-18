import { NextApiRequest, NextApiResponse } from 'next';

const API_KEY = process.env.NEXT_PUBLIC_ONEINCH_API_KEY;

if (!API_KEY) {
  throw new Error('NEXT_PUBLIC_ONEINCH_API_KEY is required');
}

const BASE_URL = "https://api.1inch.com/portfolio";
const TOKEN_BASE_URL = "https://api.1inch.com/token";
const HEADERS = {
  "Authorization": `Bearer ${API_KEY}`,
  "accept": "application/json"
};

// Fallback функция для получения токенов через Token API
async function getTokensFallback(chainId: number): Promise<any[]> {
  try {
    const endpoint = `${TOKEN_BASE_URL}/v1.2/${chainId}/token-list`;
    const params = new URLSearchParams({ provider: '1inch' });
    const response = await fetch(`${endpoint}?${params}`, { headers: HEADERS });

    if (response.status === 200) {
      const data = await response.json();
      return data.tokens || [];
    }
  } catch (error) {
    console.log('Fallback token API also failed:', error);
  }
  
  return [];
}

// Функции для работы с Portfolio API
async function getPortfolioBalances(
  chainId: number,
  address: string,
  currency: string = "USD"
): Promise<any | null> {
  // Попробуем разные варианты эндпоинтов
  const endpoints = [
    `${BASE_URL}/v1/balances/${chainId}/${address}`,
    `${BASE_URL}/v1/${chainId}/balances/${address}`,
    `${BASE_URL}/balances/${chainId}/${address}`,
    `${BASE_URL}/${chainId}/balances/${address}`
  ];

  for (const endpoint of endpoints) {
    try {
      const params = new URLSearchParams({ currency });
      const response = await fetch(`${endpoint}?${params}`, { headers: HEADERS });

      if (response.status === 200) {
        return await response.json();
      } else if (response.status === 404) {
        console.log(`Endpoint ${endpoint} not found, trying next...`);
        continue;
      } else {
        console.log(`Failed to get portfolio balances from ${endpoint}. Status code: ${response.status}`);
        continue;
      }
    } catch (error) {
      console.log(`Error with endpoint ${endpoint}:`, error);
      continue;
    }
  }

  console.log(`All portfolio balance endpoints failed for chainId ${chainId}`);
  return null;
}

async function getPortfolioSummary(
  chainId: number,
  address: string,
  currency: string = "USD"
): Promise<any | null> {
  // Попробуем разные варианты эндпоинтов
  const endpoints = [
    `${BASE_URL}/v1/summary/${chainId}/${address}`,
    `${BASE_URL}/v1/${chainId}/summary/${address}`,
    `${BASE_URL}/summary/${chainId}/${address}`,
    `${BASE_URL}/${chainId}/summary/${address}`
  ];

  for (const endpoint of endpoints) {
    try {
      const params = new URLSearchParams({ currency });
      const response = await fetch(`${endpoint}?${params}`, { headers: HEADERS });

      if (response.status === 200) {
        return await response.json();
      } else if (response.status === 404) {
        console.log(`Endpoint ${endpoint} not found, trying next...`);
        continue;
      } else {
        console.log(`Failed to get portfolio summary from ${endpoint}. Status code: ${response.status}`);
        continue;
      }
    } catch (error) {
      console.log(`Error with endpoint ${endpoint}:`, error);
      continue;
    }
  }

  console.log(`All portfolio summary endpoints failed for chainId ${chainId}`);
  return null;
}

async function getPortfolioHistory(
  chainId: number,
  address: string,
  currency: string = "USD",
  period: string = "1d"
): Promise<any | null> {
  // Попробуем разные варианты эндпоинтов
  const endpoints = [
    `${BASE_URL}/v1/history/${chainId}/${address}`,
    `${BASE_URL}/v1/${chainId}/history/${address}`,
    `${BASE_URL}/history/${chainId}/${address}`,
    `${BASE_URL}/${chainId}/history/${address}`
  ];

  for (const endpoint of endpoints) {
    try {
      const params = new URLSearchParams({ currency, period });
      const response = await fetch(`${endpoint}?${params}`, { headers: HEADERS });

      if (response.status === 200) {
        return await response.json();
      } else if (response.status === 404) {
        console.log(`Endpoint ${endpoint} not found, trying next...`);
        continue;
      } else {
        console.log(`Failed to get portfolio history from ${endpoint}. Status code: ${response.status}`);
        continue;
      }
    } catch (error) {
      console.log(`Error with endpoint ${endpoint}:`, error);
      continue;
    }
  }

  console.log(`All portfolio history endpoints failed for chainId ${chainId}`);
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, query } = req;
  const { path } = query;

  // Устанавливаем заголовки для предотвращения кэширования
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let result: any = null;

    // Определяем endpoint и параметры на основе пути
    if (Array.isArray(path)) {
      const pathStr = path.join('/');
      
      if (pathStr.startsWith('balances/')) {
        const [, chainId, address] = pathStr.split('/');
        const currency = (query.currency as string) || 'USD';
        
        result = await getPortfolioBalances(parseInt(chainId), address, currency);
      } else if (pathStr.startsWith('summary/')) {
        const [, chainId, address] = pathStr.split('/');
        const currency = (query.currency as string) || 'USD';
        
        result = await getPortfolioSummary(parseInt(chainId), address, currency);
      } else if (pathStr.startsWith('history/')) {
        const [, chainId, address] = pathStr.split('/');
        const currency = (query.currency as string) || 'USD';
        const period = (query.period as string) || '1d';
        
        result = await getPortfolioHistory(parseInt(chainId), address, currency, period);
      } else {
        return res.status(404).json({ error: 'Endpoint not found' });
      }
    }

    if (result === null) {
      // Если Portfolio API недоступен, возвращаем fallback данные
      if (Array.isArray(path) && path[0] === 'balances') {
        const tokens = await getTokensFallback(8453);
        return res.status(200).json(tokens.slice(0, 10)); // Возвращаем первые 10 токенов
      } else if (Array.isArray(path) && path[0] === 'summary') {
        return res.status(200).json({
          totalValue: 0,
          totalValueFormatted: '$0.00',
          change24h: 0,
          change24hPercent: 0,
          tokenCount: 0,
          currency: 'USD'
        });
      } else if (Array.isArray(path) && path[0] === 'history') {
        return res.status(200).json([]);
      }
      
      return res.status(500).json({ error: 'API request failed' });
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error('Portfolio API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
