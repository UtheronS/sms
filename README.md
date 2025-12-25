```markdown
# Temporary SMS Numbers MVP

Краткосрочная аренда SMS-номеров (MVP) — Node.js + Express + SQLite

Функциональность:

- Выдача временного номера (5–30 минут)
- Принятие 1–3 входящих SMS
- Автоматическое завершение аренды
- API-адаптер для SMS-агрегатора (mock реализован)
- JWT авторизация
- Минималистичный frontend

Запуск локально:

1. Установите зависимости:
   npm install

2. Скопируйте .env.example в .env и настройте значения:
   cp .env.example .env

   # отредактируйте .env

3. Инициализируйте базу:
   npm run migrate

4. Запустите сервер:
   npm run dev

   # или

   npm start

5. Откройте в браузере:
   http://localhost:3000

Тестирование mock-провайдера:

- В mock реализована возможность «симулировать» входящее SMS через POST /provider/webhook
  Пример:
  curl -X POST http://localhost:3000/provider/webhook -H "Content-Type: application/json" -d '{"provider*rental_id":"prov*...", "from":"+12025550123", "text":"Your code 1234"}'

Архитектура:

- Monolith MVP
- Простая адаптация провайдера (src/services/provider/adapter.js)
- Frontend: public/index.html, public/app.js, public/style.css

Замечания безопасности и использования:

- Не используйте этот MVP для обхода ToS сторонних сервисов.
- Предназначено для QA/testing/infrastructure use-cases.
```
