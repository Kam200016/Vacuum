# Vacuum — Курс по вакуумной технике

Веб-приложение для самостоятельного изучения курса по вакуумной технике: 6 модулей, 52 урока с прогрессом, поиском и удобной навигацией.

Сборка на Next.js 16 (App Router) + React 19 + TypeScript, UI на Tailwind CSS 4 и shadcn/ui (Radix), управление состоянием через Zustand, ORM Prisma (SQLite).

## Возможности

- Каталог из 6 модулей и 52 уроков с цветовой кодировкой
- Слайд-панель урока с разделами лекций (`LessonView`)
- Прогресс прохождения с сохранением в `localStorage` (Zustand persist)
- Сайдбар с поиском по названиям модулей и уроков
- Кнопка сброса прогресса
- Адаптивный дизайн (мобильный, планшет, десктоп)
- Полностью русскоязычный интерфейс

## Структура

```
src/
  app/                # Next.js App Router (page.tsx, layout.tsx, api/)
  components/
    course/           # Header, Sidebar, ModuleCard, LessonView
    ui/               # shadcn/ui компоненты
  data/               # course-data.ts, lecture-content.ts
  hooks/              # use-toast, use-mobile
  lib/                # db.ts (Prisma), utils.ts
  store/              # progress-store.ts (Zustand + persist)
prisma/schema.prisma  # SQLite модели User / Post (заготовка)
public/               # logo.svg, robots.txt
```

## Быстрый старт

Требуется [Bun](https://bun.sh) (или npm).

```bash
bun install
bun run db:generate
bun run dev
```

Откройте http://localhost:3000.

## Скрипты

- `bun run dev` — запуск dev-сервера на порту 3000
- `bun run build` — production-сборка (Next standalone)
- `bun run start` — запуск собранного `server.js`
- `bun run lint` — ESLint
- `bun run db:generate` — генерация Prisma Client
- `bun run db:push` — синхронизация схемы с базой
- `bun run db:migrate` — Prisma миграции (dev)

## Переменные окружения

См. `.env`:

```
DATABASE_URL="file:./db/custom.db"
```

## Лицензия

Внутренний проект.
