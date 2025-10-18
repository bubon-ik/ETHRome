/**
 * Тестовый API route для проверки 1inch API ключа
 */

import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const apiKey = process.env.NEXT_PUBLIC_ONEINCH_API_KEY;
  
  console.log('🔑 Testing API key:', apiKey);
  console.log('🔑 API key length:', apiKey?.length || 0);

  try {
    // Тестируем обычный 1inch API (не Fusion)
    const testUrl = `https://api.1inch.io/v5.2/8453/tokens`;
    
    console.log('🧪 Testing with URL:', testUrl);
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-API-Key': apiKey || '',
      },
    });

    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
      
      return res.status(response.status).json({
        error: 'API test failed',
        status: response.status,
        statusText: response.statusText,
        errorText: errorText,
        apiKey: apiKey ? `${apiKey.substring(0, 8)}...` : 'missing',
      });
    }

    const data = await response.json();
    console.log('✅ API test successful!');
    
    res.status(200).json({
      success: true,
      message: 'API key is valid',
      tokenCount: data.tokens ? Object.keys(data.tokens).length : 0,
      apiKey: apiKey ? `${apiKey.substring(0, 8)}...` : 'missing',
    });

  } catch (error) {
    console.error('❌ API test error:', error);
    res.status(500).json({
      error: 'API test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      apiKey: apiKey ? `${apiKey.substring(0, 8)}...` : 'missing',
    });
  }
}
