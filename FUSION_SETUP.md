# 1inch Fusion SDK Setup Guide

Подробное руководство по настройке и использованию 1inch Fusion SDK для gasless batch swaps.

## 🎯 Что такое Fusion?

**1inch Fusion** - это революционная технология для **gasless свапов**:
- ⚡ **Нулевые gas fees** для пользователя
- 🔄 Swap выполняются через **resolvers** (third-party relayers)
- 💰 Resolvers платят за gas и берут небольшую комиссию (~0.5-1%)
- 🚀 Оптимальный роутинг через множество DEX

## 📋 Требования

### 1. API Ключ от 1inch

1. Перейдите на [1inch Developer Portal](https://portal.1inch.dev/)
2. Создайте аккаунт
3. Создайте новый API ключ
4. Скопируйте ключ

### 2. Конфигурация

Создайте файл `.env.local`:

```bash
# 1inch API Key (ОБЯЗАТЕЛЬНО для Fusion)
NEXT_PUBLIC_ONEINCH_API_KEY=your_api_key_here

# WalletConnect Project ID
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# Base RPC (опционально)
NEXT_PUBLIC_BASE_RPC_URL=https://mainnet.base.org
```

## 🚀 Быстрый старт

### Установка

Зависимости уже установлены:
```bash
npm install @1inch/fusion-sdk@^2.1.12-rc.0
npm install wagmi@^2.17.5 viem@^2.37.9
```

### Инициализация

Fusion SDK автоматически инициализируется в `lib/1inch-fusion.ts`:

```typescript
import { fusionService } from '@/lib/1inch-fusion';

// Проверить статус
const features = fusionService.getFeatures();
console.log('Fusion enabled:', features.fusionSwaps);
console.log('Gasless mode:', features.gaslessTransactions);
```

## 💡 Использование

### Создание Fusion Batch Swap

```typescript
import { useBatchSwap } from '@/hooks/useBatchSwap';

function MyComponent() {
  const { executeFusionBatchSwap, fusionOrders, isLoading } = useBatchSwap();

  const handleSwap = async () => {
    await executeFusionBatchSwap({
      routes: [
        {
          from: { address: '0x...', amount: '1.0', decimals: 18, ... },
          to: { address: '0x...', decimals: 6, ... }
        }
      ],
      recipient: userAddress,
      slippage: 1, // 1%
    });
  };

  return (
    <div>
      <button onClick={handleSwap} disabled={isLoading}>
        {isLoading ? 'Creating Orders...' : 'Swap (Gasless)'}
      </button>
      
      {fusionOrders.map(order => (
        <div key={order.order.orderHash}>
          Order: {order.order.orderHash}
          Status: {order.order.status}
        </div>
      ))}
    </div>
  );
}
```

### Dual Mode (Fusion + Standard)

```typescript
import { useBatchSwap } from '@/hooks/useBatchSwap';

function SwapInterface() {
  const { executeBatchSwap } = useBatchSwap();

  // Fusion mode (gasless)
  const swapFusion = () => executeBatchSwap({
    routes,
    recipient: address,
    slippage: 1,
    mode: 'fusion' // gasless
  });

  // Standard mode (with gas via sendCalls)
  const swapStandard = () => executeBatchSwap({
    routes,
    recipient: address,
    slippage: 1,
    mode: 'standard' // with gas
  });
}
```

## 🏗 Архитектура

### Как работает Fusion Batch Swap

1. **Создание котировок**
   ```typescript
   const quote = await fusionService.getFusionQuote({
     fromTokenAddress: '0x...',
     toTokenAddress: '0x...',
     amount: '1000000',
     walletAddress: address
   });
   ```

2. **Создание Fusion orders**
   ```typescript
   const order = await fusionService.createFusionOrder({
     fromTokenAddress: '0x...',
     toTokenAddress: '0x...',
     amount: '1000000',
     walletAddress: address
   });
   // Возвращает orderHash
   ```

3. **Batch orders**
   ```typescript
   const orders = await fusionService.createBatchFusionOrders({
     routes: [...],
     walletAddress: address
   });
   // Создает несколько orders одновременно
   ```

4. **Отслеживание статуса**
   ```typescript
   const status = await fusionService.getOrderStatus(orderHash);
   // Pending, Filled, Cancelled, Expired
   ```

### Компоненты

- **`lib/1inch-fusion.ts`** - Главный сервис Fusion SDK
- **`lib/fusion-utils.ts`** - Вспомогательные утилиты
- **`hooks/useBatchSwap.ts`** - React hook с dual mode
- **`components/BatchSwapButton.tsx`** - UI компонент

## 🔧 API Reference

### FusionService

#### `getFusionQuote(params)`
Получить котировку для swap через Fusion.

**Params:**
- `fromTokenAddress: string` - Адрес токена для продажи
- `toTokenAddress: string` - Адрес токена для покупки
- `amount: string` - Сумма в wei
- `walletAddress: string` - Адрес кошелька

**Returns:** `SwapQuote`

#### `createFusionOrder(params)`
Создать Fusion order (gasless).

**Params:**
- `fromTokenAddress: string`
- `toTokenAddress: string`
- `amount: string`
- `walletAddress: string`
- `permit?: string` - Permit signature для gasless approve

**Returns:** `FusionOrder` с `orderHash`

#### `createBatchFusionOrders(params)`
Создать несколько Fusion orders.

**Params:**
- `routes: Array<{ from: Token, to: Token }>`
- `walletAddress: string`

**Returns:** `BatchSwapOrder[]`

#### `getOrderStatus(orderHash)`
Получить статус order.

**Returns:** `OrderStatus` (Pending, Filled, Cancelled, Expired)

#### `getActiveOrders(walletAddress)`
Получить все активные orders пользователя.

**Returns:** `FusionOrder[]`

#### `cancelOrder(orderHash)`
Отменить order.

**Returns:** `boolean`

## ⚠️ Важные замечания

### Поддержка сетей

Fusion SDK может не поддерживать все сети. Проверка:

```typescript
const features = fusionService.getFeatures();
console.log('Network:', features.network);
console.log('Chain ID:', features.chainId);
```

Поддерживаемые сети:
- ✅ Ethereum Mainnet
- ✅ Polygon
- ✅ BSC
- ✅ Arbitrum
- ✅ Optimism
- ⚠️ Base (проверьте поддержку)

### Demo Mode

Если API ключ не настроен, сервис работает в **demo mode**:
- Моковые котировки
- Симуляция orders
- Нет реальных транзакций

Проверка режима:
```typescript
const features = fusionService.getFeatures();
if (features.demoMode) {
  console.warn('Running in demo mode - add API key for production');
}
```

### Gas Fees в Fusion

Fusion **НЕ бесплатен** в полном смысле:
- ✅ Пользователь не платит gas
- ⚠️ Resolver берет комиссию из swap amount (~0.5-1%)
- 💡 Выгодно для больших сумм
- ⚠️ Может быть невыгодно для маленьких сумм

### Время выполнения

Fusion orders выполняются **асинхронно**:
- ⏱ Обычно: 10-30 секунд
- ⏱ В загруженной сети: 1-5 минут
- ⏱ Никогда не гарантировано мгновенное исполнение

Отслеживание:
```typescript
const order = await createFusionOrder(...);
const checkStatus = async () => {
  const status = await getOrderStatus(order.orderHash);
  if (status === OrderStatus.Filled) {
    console.log('✅ Order filled!');
  }
};
// Polling каждые 5 секунд
setInterval(checkStatus, 5000);
```

## 🐛 Troubleshooting

### Ошибка: "API key required"

```bash
# Добавьте API ключ в .env.local
NEXT_PUBLIC_ONEINCH_API_KEY=your_key_here

# Перезапустите сервер
npm run dev
```

### Ошибка: "Network not supported"

Base может не поддерживаться Fusion SDK. Варианты:
1. Используйте Standard mode с sendCalls
2. Переключитесь на поддерживаемую сеть (Ethereum, Polygon)

### Order не исполняется

Возможные причины:
- Цена изменилась (slippage)
- Нет ликвидности
- Resolvers не активны
- Комиссия слишком маленькая

Решение:
- Увеличьте slippage
- Подождите дольше
- Отмените order и попробуйте снова

## 📚 Дополнительные ресурсы

- [1inch Fusion Documentation](https://docs.1inch.io/docs/fusion-swap/introduction)
- [1inch Developer Portal](https://portal.1inch.dev/)
- [Fusion SDK GitHub](https://github.com/1inch/fusion-sdk)
- [wagmi sendCalls](https://wagmi.sh/core/api/actions/sendCalls)
- [EIP-5792 Specification](https://eips.ethereum.org/EIPS/eip-5792)

## 🤝 Поддержка

Вопросы? Проблемы?
- GitHub Issues: [Create issue]
- 1inch Discord: [Join server]
- Documentation: [Read docs]

---

Made with ❤️ for ETHRome Hackathon 2025

