# TechCraft — Website with Integrated Chatbot

A modern company website with a built-in chat widget powered by a Node.js/Express bot API.

## Features

- **Modern responsive website** — hero, services, about, portfolio, contact sections
- **Integrated chat widget** — floating chat button, animated window, typing indicator
- **Bot API** — rule-based bot supporting Russian and English, with intents for greetings, services, pricing, contacts, working hours, and more
- **Rate limiting** — protects the `/api/chat` endpoint (30 requests/minute per IP)
- **Smooth UX** — scroll animations, active nav highlighting, mobile burger menu

## Quick Start

```bash
# Install dependencies
npm install

# Start the server
npm start
```

Then open [http://localhost:3000](http://localhost:3000).

For development with auto-reload:

```bash
npm run dev
```

## Project Structure

```
├── server/
│   ├── index.js      # Express server
│   └── bot.js        # Bot logic and intent matching
├── public/
│   ├── index.html    # Main page
│   ├── css/
│   │   ├── style.css # Website styles
│   │   └── chat.css  # Chat widget styles
│   └── js/
│       ├── main.js   # Website interactivity
│       └── chat.js   # Chat widget logic
├── package.json
└── .env.example
```

## API

### `POST /api/chat`

Send a message to the bot.

**Request body:**
```json
{ "message": "Привет" }
```

**Response:**
```json
{
  "reply": "Привет! Рад вас видеть! Чем могу помочь?",
  "intent": "greetings",
  "timestamp": "2026-04-30T07:15:00.000Z"
}
```

### `GET /api/health`

Returns server uptime and status.

## License

AGPL-3.0
