# 🚀 Web-ресурс с ИИ-анализом отзывов пользователей

Полнофункциональное веб-приложение для анализа отзывов о товарах с использованием искусственного интеллекта и определением их тональности.

![Next.js](https://img.shields.io/badge/Next.js-14.2-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-blue)
![Prisma](https://img.shields.io/badge/Prisma-5.10-green)
![AI](https://img.shields.io/badge/AI-OpenAI_Yandex-yellow)

## ✨ Основные возможности

### 🎯 Анализ отзывов с ИИ
- **Автоматическое определение тональности** (позитивная, нейтральная, негативная)
- **Поддержка нескольких ИИ-провайдеров**:
  - OpenAI API (GPT-4o-mini)
  - Яндекс Studio API
  - Встроенный локальный анализ (fallback)
- **Извлечение ключевых слов** и выявление проблем в отзывах
- **Определение токсичности** контента

### 📊 Бизнес-сводки
- **Per-product анализ** последних 10-15 отзывов
- **Визуальная инфографика**:
  - Статистика по тональности (позитивные, нейтральные, негативные)
  - Прогресс-бары и диаграммы
  - Облако ключевых слов
- **ИИ-выводы**: впечатление, положительные аспекты, проблемы, рекомендации

### 🎨 Интерфейс
- **Красивые карточки товаров** на главной странице с:
  - Рейтингом из 5 звёзд
  - Статистикой по отзывам
  - Визуализацией распределения тональностей
- **Страница товара** с:
  - Полным списком отзывов
  - Цветовой кодировкой по тональности
  - Инфографикой с выводами ИИ
  - Формой для добавления нового отзыва
- **Панель администратора** для управления товарами и отзывами
- **Адаптивный дизайн** (мобильные, планшеты, десктоп)

## 🛠️ Технологический стек

### Frontend
- **Next.js 14** с App Router
- **React 18.2** с hooks
- **TypeScript 5.3** для типобезопасности
- **Tailwind CSS 3.4** для стилизации
- **Shadcn/ui** компоненты
- **Lucide React** иконки
- **Framer Motion** анимации
- **Sonner** toast уведомления

### Backend
- **Next.js API Routes** для REST API
- **Next.js Server Actions** для асинхронных операций
- **OpenAI SDK** для интеграции с ИИ-сервисами

### Database
- **Prisma ORM 5.10** для работы с БД
- **SQLite** файловая база данных

## 🚀 Быстрый старт

### Установка

```bash
# Клонировать репозиторий
git clone https://github.com/YOUR_USERNAME/ai-review-analyzer.git
cd ai-review-analyzer

# Перейти в директорию проекта
cd nextjs-app

# Установить зависимости
npm install

# Создать .env файл
cp .env.example .env.local
```

### Конфигурация

Отредактируй `.env.local` и добавь свои ключи (опционально):

```env
# OpenAI API (если используешь OpenAI)
OPENAI_API_KEY=sk-...

# Яндекс Studio API (если используешь Яндекс)
YANDEX_API_KEY=...
YANDEX_PROMPT_ID_REVIEWS=...
YANDEX_PROMPT_ID_INSIGHTS=...
```

### Запуск

```bash
# Инициализировать БД и заполнить тестовыми данными
npm run seed

# Запустить dev-сервер
npm run dev

# Открыть в браузере
# http://localhost:3000
```

## 📁 Структура проекта

```
nextjs-app/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── page.tsx              # Главная страница (каталог товаров)
│   │   ├── product/[id]/page.tsx # Страница товара с отзывами
│   │   ├── admin/page.tsx        # Панель администратора
│   │   ├── layout.tsx            # Root layout с Navbar
│   │   └── api/
│   │       ├── products/         # API endpoints для товаров
│   │       └── admin/            # API для администратора
│   ├── actions/
│   │   ├── reviews.ts            # Server Action для анализа отзывов
│   │   └── insights.ts           # Server Action для генерации сводок
│   ├── components/
│   │   ├── Navbar.tsx            # Навигационное меню
│   │   ├── ProductInsights.tsx   # Компонент бизнес-сводки
│   │   └── ui/                   # Shadcn/ui компоненты
│   ├── lib/
│   │   ├── prisma.ts             # Prisma клиент
│   │   └── utils.ts              # Вспомогательные функции
│   ├── types/
│   │   └── index.ts              # TypeScript типы
│   └── styles/
│       └── globals.css           # Глобальные стили
├── prisma/
│   ├── schema.prisma             # Схема БД
│   └── seed.ts                   # Скрипт для заполнения тестовых данных
├── .env.example                  # Пример переменных окружения
├── .gitignore                    # Git ignore правила
├── package.json                  # Зависимости проекта
├── tsconfig.json                 # TypeScript конфигурация
├── tailwind.config.js            # Tailwind CSS конфигурация
└── next.config.js                # Next.js конфигурация
```

## 📊 Примеры API

### Получить все товары
```bash
curl http://localhost:3000/api/products
```

Ответ включает статистику:
```json
[
  {
    "id": 1,
    "name": "iPhone 15 Pro",
    "description": "Последний флагман Apple",
    "stats": {
      "totalReviews": 15,
      "positiveCount": 10,
      "negativeCount": 3,
      "neutralCount": 2,
      "averageRating": 4.3
    }
  }
]
```

## 🚀 Развёртывание

### На Vercel (рекомендуется)
```bash
vercel
```

### На собственном сервере
```bash
npm run build
npm start
```

## 📝 Документация

- [main.tex](./main.tex) - Полная LaTeX документация (880 строк)
- [README_LaTeX.md](./README_LaTeX.md) - Гайд по LaTeX
- [LATEX_NORMCONTROL.md](./LATEX_NORMCONTROL.md) - Чек-лист ВУЗа

## 📞 Контакты

- 📧 Email: your.email@example.com
- 💬 GitHub Issues: [Открыть issue](../../issues)

---

**Создано как курсовая работа по специальности "Прикладная математика и информатика"**
ЮФУ, 2024
