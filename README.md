# Younica bot website

Static landing page with an integrated bot widget.

## How to run locally

Open `index.html` in a browser, or serve the directory with any static server:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## Bot integration

The page loads `bot-widget.js`, which provides a floating chat button and an embedded conversation panel.

Configure the bot in `index.html`:

```html
<script
  src="./bot-widget.js"
  data-api-endpoint="https://your-api.example.com/chat"
  data-bot-url="https://t.me/your_bot"
  defer
></script>
```

- `data-api-endpoint` is optional. If present, the widget sends user messages as JSON:

  ```json
  {
    "message": "User text",
    "history": [
      { "role": "bot", "content": "..." },
      { "role": "user", "content": "..." }
    ]
  }
  ```

  The endpoint can answer with `{ "reply": "..." }`, `{ "message": "..." }`, or plain text.
- `data-bot-url` is optional. It is used as a fallback action when no endpoint is configured or if the API is unavailable.

If both attributes are omitted, the widget still renders and explains how to connect the bot.
