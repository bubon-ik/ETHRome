# Token Search Functionality

Добавлена функциональность поиска токенов через 1inch API для Base сети.

## Новые файлы

### 1. Модуль для работы с токенами
- `lib/token-service.ts` - Основной сервис для работы с 1inch Token API
- `hooks/useTokenSearch.ts` - React хук для использования в компонентах
- `components/TokenSearch.tsx` - Готовый компонент для поиска токенов

### 2. API роуты
- `pages/api/1inch-tokens/[...path].ts` - API прокси для 1inch Token API

### 3. Страница поиска токенов
- `pages/token-search-demo.tsx` - Полнофункциональная страница поиска токенов

### 4. Типы
- Обновлен `types/index.ts` с новыми типами для токенов

## Возможности

### Поиск токенов
- Поиск по символу, названию или адресу
- Поддержка фильтрации и лимитов
- Автодополнение с логотипами токенов
- Реальные данные с 1inch API

### Получение информации о токенах
- Детальная информация о конкретных токенах
- Получение всех токенов из токен-листов
- Получение официального токен-листа 1inch
- Более 100 токенов Base сети

## Использование

### В компонентах
```tsx
import { TokenSearch } from '@/components/TokenSearch';

function MyComponent() {
  const handleTokenSelect = (token) => {
    console.log('Selected token:', token);
  };

  return (
    <TokenSearch
      onTokenSelect={handleTokenSelect}
      placeholder="Search tokens..."
      showAllTokens={true}
      limit={10}
    />
  );
}
```

### Через хук
```tsx
import { useTokenSearch } from '@/hooks/useTokenSearch';

function MyComponent() {
  const { searchTokens, isLoading, error } = useTokenSearch();

  const handleSearch = async () => {
    try {
      const results = await searchTokens({
        query: 'USDC',
        chainId: 8453,
        limit: 10
      });
      console.log('Search results:', results);
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  return (
    <div>
      <button onClick={handleSearch} disabled={isLoading}>
        {isLoading ? 'Searching...' : 'Search'}
      </button>
      {error && <p>Error: {error}</p>}
    </div>
  );
}
```

### Прямое использование сервиса
```tsx
import { tokenService } from '@/lib/token-service';

// Поиск токенов
const results = await tokenService.searchTokens({
  query: 'ETH',
  chainId: 8453,
  limit: 5
});

// Получение информации о токенах
const info = await tokenService.getTokensInfo({
  chainId: 8453,
  addresses: ['0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913']
});

// Получение всех токенов
const allTokens = await tokenService.getAllTokensInfo({
  chainId: 8453,
  provider: '1inch'
});
```

## Демо страница

Перейдите на `/token-search-demo` для тестирования всех возможностей:

- Интерактивный поиск токенов
- Ручной поиск с результатами
- Загрузка всех токенов
- Детальная информация о выбранном токене

## API ключ

**ОБЯЗАТЕЛЬНО**: Требуется API ключ от 1inch для работы функциональности.

Получите API ключ на https://portal.1inch.dev/ и добавьте в `.env.local`:

```
NEXT_PUBLIC_ONEINCH_API_KEY=your_api_key_here
```

## Поддерживаемые сети

В настоящее время настроено для Base mainnet (chainId: 8453), но легко расширяется для других сетей.

## Статус

✅ **Полностью рабочий код** - никаких демо режимов, только реальные данные с 1inch API
