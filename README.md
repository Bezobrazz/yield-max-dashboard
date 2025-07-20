# 📊 YieldMax ETF Dashboard

Реактивний дашборд для відстеження цін YieldMax ETF в реальному часі.

## 🚀 Швидкий старт

### 1. Встановлення залежностей

```bash
npm install
```

### 2. Запуск проксі сервера (порт 3003)

```bash
npm run proxy
```

### 3. Запуск React додатку (порт 3002)

```bash
npm run dev
```

### 4. Відкрийте браузер

Перейдіть на http://localhost:3002

## 🔧 API джерела даних

### Yahoo Finance API (за замовчуванням)

- ✅ Повністю безкоштовний
- ✅ Не потребує API ключа
- ✅ Реальні дані в реальному часі

### Alpha Vantage API (альтернатива)

- ✅ Безкоштовний план з 5 запитами/хвилину
- ⚠️ Потребує реєстрації для API ключа

## 📋 Відстежувані ETF

- **MSTY** - YieldMax MSTR Option Income Strategy ETF
- **TSLY** - YieldMax TSLA Option Income Strategy ETF
- **NVDY** - YieldMax NVDA Option Income Strategy ETF
- **CONY** - YieldMax COIN Option Income Strategy ETF
- **ULTY** - YieldMax TSLA 2x Option Income Strategy ETF
- **YMAX** - YieldMax 500 Option Income Strategy ETF

## 🛠️ Технології

- **Frontend**: React 18, Vite, Tailwind CSS
- **API**: Yahoo Finance, Alpha Vantage
- **Проксі**: Express.js сервер для обходу CORS

## 📊 Функціональність

- ✅ Відображення цін ETF в реальному часі
- ✅ Розрахунок зміни цін у відсотках
- ✅ Показ попередньої ціни та об'єму торгів
- ✅ Автоматичне оновлення кожні 5 хвилин
- ✅ Обробка помилок API
- ✅ Адаптивний дизайн

## 🔍 Вирішення проблем

### CORS помилки

- Використовується локальний проксі сервер
- Автоматичне перемикання між джерелами даних

### API не відповідає

- Показується інформативне повідомлення про помилку
- Автоматична спроба підключення до резервного API

### Ліміти запитів

- Alpha Vantage: 5 запитів/хвилину для безкоштовного плану
- Yahoo Finance: без лімітів

## 📝 Ліцензія

MIT License
