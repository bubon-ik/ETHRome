# 🚀 QuickStart Guide - Batch Swap с 1inch Fusion

Быстрое руководство по запуску проекта с gasless batch swap.

## ⚡ Быстрый старт (5 минут)

### 1. Установка

```bash
cd ETHRome
npm install
```

### 2. Настройка API ключей

Скопируйте ваши API ключи в `.env.local`:

```bash
# Уже есть в env.example, просто проверьте
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=7b6f6c4eb808beb7bd577b581f1688f1
NEXT_PUBLIC_ONEINCH_API_KEY=7Jxl6WAsyKWDO63WeYmLqIlsHLhiMsky
```

Или создайте новый `.env.local`:

```bash
echo "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=7b6f6c4eb808beb7bd577b581f1688f1" > .env.local
echo "NEXT_PUBLIC_ONEINCH_API_KEY=7Jxl6WAsyKWDO63WeYmLqIlsHLhiMsky" >> .env.local
```

### 3. Запуск

```bash
npm run dev
```

Откройте http://localhost:3000

## 🎯 Как использовать

### Fusion Mode (Gasless) - РЕКОМЕНДУЕТСЯ ⚡

1. Подключите кошелек (MetaMask, WalletConnect)
2. Выберите **Fusion Mode** (по умолчанию)
3. Добавьте swap routes:
   - From: ETH, Amount: 0.1
   - To: USDC
4. Нажмите **"Swap (Gasless ⚡)"**
5. Подпишите Fusion orders (БЕЗ gas!)
6. Дождитесь выполнения resolvers (~10-60 сек)

### Standard Mode (С gas)

1. Переключитесь на **Standard Mode**
2. Добавьте swap routes
3. Нажмите **"Swap Multiple Tokens"**
4. Подтвердите транзакцию (с gas)
5. Batch swap выполнится сразу

## 📋 Что делает проект

### Основные возможности

✅ **Batch Swap** - меняйте несколько токенов в одной транзакции
✅ **Gasless Mode** - ZERO gas fees через 1inch Fusion
✅ **Dual Mode** - выбор между gasless и standard
✅ **Real-time Tracking** - отслеживание статуса orders
✅ **Modern UI** - красивый интерфейс

### Технологический стек

- **Frontend**: Next.js + React + TypeScript
- **Web3**: Wagmi v2 + Viem + RainbowKit
- **Swap Engine**: 1inch Fusion SDK + Limit Order SDK
- **Batch Txs**: EIP-5792 sendCalls
- **Network**: Base Mainnet

## 🔧 Структура проекта

```
ETHRome/
├── components/
│   ├── BatchSwapButton.tsx    # Главная кнопка с Fusion
│   ├── ModeSelector.tsx       # Переключатель режимов
│   └── SwapInterface.tsx      # Основной интерфейс
├── hooks/
│   └── useBatchSwap.ts        # Hook с dual mode
├── lib/
│   ├── 1inch-fusion.ts        # Fusion SDK сервис
│   ├── fusion-utils.ts        # Утилиты
│   └── wagmi.ts               # Wagmi config
└── pages/
    └── index.tsx              # Главная страница
```

## 💡 Примеры использования

### Пример 1: Простой Fusion Swap

```typescript
import { useBatchSwap } from '@/hooks/useBatchSwap';

function MySwap() {
  const { executeFusionBatchSwap, fusionOrders } = useBatchSwap();

  const swap = async () => {
    await executeFusionBatchSwap({
      routes: [{
        from: { address: '0x...ETH', amount: '0.1', decimals: 18, ... },
        to: { address: '0x...USDC', decimals: 6, ... }
      }],
      recipient: userAddress,
      slippage: 1,
    });
  };

  return <button onClick={swap}>Swap (Gasless)</button>;
}
```

### Пример 2: Dual Mode с переключением

```typescript
import { useBatchSwap } from '@/hooks/useBatchSwap';
import ModeSelector from '@/components/ModeSelector';

function AdvancedSwap() {
  const [mode, setMode] = useState<SwapMode>('fusion');
  const { executeBatchSwap } = useBatchSwap();

  const swap = async () => {
    await executeBatchSwap({
      routes,
      recipient: address,
      slippage: 1,
      mode, // 'fusion' или 'standard'
    });
  };

  return (
    <>
      <ModeSelector mode={mode} onChange={setMode} />
      <button onClick={swap}>Swap</button>
    </>
  );
}
```

## 🐛 Решение проблем

### Проблема: "API key required"

**Решение:**
```bash
# Проверьте .env.local
cat .env.local

# Должно быть:
NEXT_PUBLIC_ONEINCH_API_KEY=your_key_here

# Перезапустите
npm run dev
```

### Проблема: Orders не выполняются

**Причины:**
- Resolvers заняты → подождите
- Цена изменилась → увеличьте slippage
- Мало ликвидности → измените сумму

**Решение:**
```typescript
// Увеличьте slippage
slippage: 2 // было 1

// Или переключитесь на Standard mode
mode: 'standard'
```

### Проблема: Wallet не подключается

**Решение:**
1. Проверьте WalletConnect Project ID
2. Перезагрузите страницу
3. Очистите кэш браузера
4. Попробуйте другой кошелек

## 📚 Дополнительная документация

- **[FUSION_SETUP.md](./FUSION_SETUP.md)** - Подробная настройка Fusion SDK
- **[README.md](./README.md)** - Основная документация проекта

## 🎓 Обучающие материалы

### Как работает Fusion?

1. Вы создаете **off-chain order**
2. Order попадает в **order book** 1inch
3. **Resolvers** (боты) мониторят orders
4. Resolver находит лучший роутинг
5. Resolver выполняет swap и платит gas
6. Resolver берет комиссию (~0.5-1%)
7. Вы получаете токены БЕЗ gas fees!

### Когда использовать Fusion?

✅ **Используйте Fusion (gasless):**
- Большие суммы (>$100)
- Нет спешки (10-60 сек OK)
- Хотите сэкономить на gas
- Много свапов (batch)

❌ **Используйте Standard:**
- Маленькие суммы (<$50)
- Нужно мгновенно
- Критичный тайминг
- Gas fees низкие

## 🚀 Следующие шаги

1. ✅ Запустите проект
2. ✅ Попробуйте Fusion swap
3. ✅ Сравните с Standard mode
4. 📖 Изучите [FUSION_SETUP.md](./FUSION_SETUP.md)
5. 🔧 Кастомизируйте под свои нужды
6. 🚀 Deploy на Vercel

## 💬 Поддержка

Вопросы? Проблемы?
- GitHub Issues
- Discord
- Email

---

**Готово! Теперь у вас работает Batch Swap с Gasless транзакциями! ⚡**

Made with ❤️ for ETHRome Hackathon 2025

