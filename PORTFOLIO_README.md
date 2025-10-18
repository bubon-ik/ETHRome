# Portfolio Module - 1inch Integration

Полноценный модуль портфолио с интеграцией 1inch Portfolio API для отображения балансов токенов подключенного кошелька.

## 🚀 Что реализовано:

### 1. **API Integration**
- `/api/1inch-portfolio/[...path].ts` - API роуты для 1inch Portfolio API
- Поддержка всех эндпоинтов: balances, summary, history
- Обработка ошибок и кэширования

### 2. **Services & Hooks**
- `lib/portfolio-service.ts` - сервис для работы с Portfolio API
- `hooks/usePortfolio.ts` - React хук для использования в компонентах
- Singleton паттерн для единого экземпляра сервиса

### 3. **Components**
- `components/PortfolioView.tsx` - основной компонент портфолио
- `TokenCard` - карточка токена с балансом и ценой
- `PortfolioSummaryCard` - сводка по портфолио

### 4. **Types**
- Обновлен `types/index.ts` с типами для портфолио
- `PortfolioToken`, `PortfolioSummary`, `PortfolioHistory`
- Полная типизация всех данных

### 5. **Integration**
- Интегрирован в Analytics вкладку главной страницы
- Автоматическая загрузка при подключении кошелька
- Адаптивный дизайн для всех устройств

## 📊 Функциональность:

### **Portfolio Summary**
- Общая стоимость портфолио в USD
- Изменение за 24 часа (в $ и %)
- Количество токенов в портфолио

### **Token Holdings**
- Список всех токенов с балансами
- Цена каждого токена
- Стоимость позиции
- Изменение цены за 24 часа
- Логотипы токенов

### **Controls**
- Переключение показа/скрытия нулевых балансов
- Автоматическое обновление данных
- Обработка состояний загрузки и ошибок

### **Responsive Design**
- Адаптивная сетка токенов (1-3 колонки)
- Красивые анимации и переходы
- Поддержка темной/светлой темы

## 🔧 API Endpoints:

### **Balances**
```
GET /api/1inch-portfolio/balances/{chainId}/{address}?currency=USD
```
Возвращает массив токенов с балансами и ценами.

### **Summary**
```
GET /api/1inch-portfolio/summary/{chainId}/{address}?currency=USD
```
Возвращает сводку по портфолио.

### **History**
```
GET /api/1inch-portfolio/history/{chainId}/{address}?currency=USD&period=1d
```
Возвращает историю изменений портфолио.

## 🎯 Использование:

### **В компонентах**
```tsx
import { usePortfolio } from '@/hooks/usePortfolio';

function MyComponent() {
  const { getPortfolioData, isLoading, error } = usePortfolio();
  
  const loadPortfolio = async () => {
    const data = await getPortfolioData({
      chainId: 8453,
      address: '0x...',
      currency: 'USD'
    });
  };
}
```

### **Прямое использование сервиса**
```tsx
import { portfolioService } from '@/lib/portfolio-service';

const tokens = await portfolioService.getPortfolioBalances({
  chainId: 8453,
  address: '0x...',
  currency: 'USD'
});
```

## 📍 Доступ:

1. Откройте главную страницу
2. Подключите кошелек
3. Перейдите на вкладку "Analytics"
4. Портфолио загрузится автоматически

## 🔑 Требования:

- **API ключ 1inch** (уже настроен)
- **Подключенный кошелек** для отображения данных
- **Base сеть** (chainId: 8453)

## ✨ Особенности:

- **Реальные данные** с 1inch Portfolio API
- **Автоматическое обновление** при изменении кошелька
- **Красивый UI** с анимациями
- **Обработка ошибок** и состояний загрузки
- **Адаптивный дизайн** для всех устройств

Теперь вкладка Analytics показывает полноценное портфолио с реальными данными! 🎉
