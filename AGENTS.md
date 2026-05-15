# AGENTS.md

## Cursor Cloud specific instructions

### Overview

This is a Node.js/Express website ("TechCraft") with an integrated rule-based chatbot widget. No database, no external APIs, no build step required.

### Running the dev server

```bash
npm run dev
```

Server starts on `http://localhost:3000` (uses nodemon for hot-reload). The port is configurable via `PORT` env var (see `.env.example`).

### Project structure

- `server/index.js` — Express entry point (serves static files + chat/health API)
- `server/bot.js` — Rule-based bot logic (regex intent matching, Russian/English)
- `public/` — Static frontend (HTML/CSS/JS, no build step)

### API endpoints

- `POST /api/chat` — Send `{ "message": "..." }`, get `{ "reply", "intent", "timestamp" }`
- `GET /api/health` — Returns `{ "status": "ok", "uptime": ... }`

### Testing

No automated test suite exists in this repo. Verify changes by:
1. Starting the dev server (`npm run dev`)
2. Checking `GET /api/health` returns status "ok"
3. Testing chat via `POST /api/chat` with sample messages (e.g. "Привет", "Услуги", "Контакты")
4. Loading `http://localhost:3000` in a browser and using the chat widget

### Notes

- No linter configured in `package.json`. If you need lint checks, use `npx eslint .` (ESLint is not a project dependency).
- The `.env` file is gitignored. Copy `.env.example` to `.env` before first run if needed (default port 3000 is hardcoded as fallback).
- Rate limiting on `/api/chat`: 30 requests/minute per IP.
