import { NextApiRequest, NextApiResponse } from 'next';

const API_KEY = process.env.NEXT_PUBLIC_ONEINCH_API_KEY;

if (!API_KEY) {
  throw new Error('NEXT_PUBLIC_ONEINCH_API_KEY is required');
}

const BASE_URL = "https://api.1inch.com/token";
const HEADERS = {
  "Authorization": `Bearer ${API_KEY}`,
  "accept": "application/json"
};

// Функции согласно официальному коду 1inch
async function searchTokens(
  query: string,
  chainId: number,
  limit: number = 10,
  ignoreListed: string = "false"
): Promise<any | null> {
  const endpoint = `${BASE_URL}/v1.2/${chainId}/search`;
  const params = new URLSearchParams({
    query,
    limit: limit.toString(),
    ignore_listed: ignoreListed
  });

  const response = await fetch(`${endpoint}?${params}`, { headers: HEADERS });

  if (response.status === 200) {
    return await response.json();
  } else {
    console.log(`Failed to search tokens. Status code: ${response.status}`);
    return null;
  }
}

async function getTokensInfo(chainId: number, addresses: string[]): Promise<any | null> {
  const endpoint = `${BASE_URL}/v1.2/${chainId}/custom/${addresses.join(',')}`;
  const response = await fetch(endpoint, { headers: HEADERS });

  if (response.status === 200) {
    return await response.json();
  } else {
    console.log(`Failed to get tokens info. Status code: ${response.status}`);
    return null;
  }
}

async function getAllTokensInfo(chainId: number, provider: string = "1inch"): Promise<any | null> {
  const endpoint = `${BASE_URL}/v1.2/${chainId}`;
  const params = new URLSearchParams({ provider });

  const response = await fetch(`${endpoint}?${params}`, { headers: HEADERS });

  if (response.status === 200) {
    return await response.json();
  } else {
    console.log(`Failed to get all tokens info. Status code: ${response.status}`);
    return null;
  }
}

async function get1inchTokenList(chainId: number, provider: string = "1inch"): Promise<any | null> {
  const endpoint = `${BASE_URL}/v1.2/${chainId}/token-list`;
  const params = new URLSearchParams({ provider });

  const response = await fetch(`${endpoint}?${params}`, { headers: HEADERS });

  if (response.status === 200) {
    return await response.json();
  } else {
    console.log(`Failed to get 1inch token list. Status code: ${response.status}`);
    return null;
  }
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
      
      if (pathStr === 'search') {
        const queryParam = query.query as string;
        const limit = parseInt(query.limit as string) || 10;
        const ignoreListed = (query.ignore_listed as string) || 'false';
        
        result = await searchTokens(queryParam, 8453, limit, ignoreListed);
      } else if (pathStr.startsWith('custom/')) {
        const addresses = pathStr.replace('custom/', '').split(',');
        result = await getTokensInfo(8453, addresses);
      } else if (pathStr === 'all') {
        const provider = (query.provider as string) || '1inch';
        result = await getAllTokensInfo(8453, provider);
      } else if (pathStr === 'token-list') {
        const provider = (query.provider as string) || '1inch';
        result = await get1inchTokenList(8453, provider);
      } else {
        return res.status(404).json({ error: 'Endpoint not found' });
      }
    }

    if (result === null) {
      return res.status(500).json({ error: 'API request failed' });
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error('Token API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
