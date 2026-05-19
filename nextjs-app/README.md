# AI Review Analyzer (Next.js)

Веб-приложение для работы с отзывами:
- публикация отзывов пользователями,
- AI-анализ (тональность, ключевые слова, токсичность),
- админ-дашборд с графиками,
- пакетная загрузка CSV,
- AI-сводка по бизнесу,
- генератор ответа владельца на отзыв.

## Стек
- Next.js 14 (App Router)
- TypeScript
- Prisma + SQLite
- Tailwind CSS
- Recharts
- Framer Motion
- Sonner
- OpenAI SDK (с поддержкой Yandex AI/OpenRouter/OpenAI через env)

## Быстрый старт
```bash
cd nextjs-app
npm install
cp .env.example .env
npm run db:push
npm run dev
```

Открыть: `http://localhost:3000` (или другой порт, который покажет Next.js).

## Переменные окружения
См. `.env.example`.

Минимально для Yandex:
- `AI_PROVIDER="yandex"`
- `YANDEX_API_KEY`
- `YANDEX_PROJECT_ID` (и/или `YANDEX_FOLDER_ID`)
- `AUTH_SECRET`

## Скрипты
- `npm run dev` — локальная разработка
- `npm run build` — production build
- `npm run start` — запуск production
- `npm run db:push` — синхронизация Prisma схемы
- `npm run seed` — заполнение тестовыми данными

## Публикация на GitHub
1. Убедись, что `.env` не попал в git.
2. Инициализация и первый push:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<username>/<repo>.git
git push -u origin main
```

## Примечание
Если хочешь хранить demo-базу в репозитории — оставь `prisma/dev.db` в git.
Если не хочешь — раскомментируй строки для `prisma/dev.db` в `.gitignore`.
