# Younica bot site

Static landing page with an integrated bot entry point. The page includes:

- CTA buttons that open the bot in Telegram.
- A floating chat-style bot widget.
- A single configuration object for changing the bot username or URL.

## Configure the bot link

Open `bot-widget.js` and update `BOT_CONFIG`:

```js
const BOT_CONFIG = {
  botUsername: "Younica_bot",
  botUrl: "https://t.me/Younica_bot",
  initialMessage: "Здравствуйте! Я бот Younica. Чем могу помочь?"
};
```

If `botUrl` is empty, the site builds the Telegram link from `botUsername`.
Set `botUrl` only when the public bot link differs from `https://t.me/<botUsername>`.

## Run locally

No build step is required. Serve the directory with any static server, for example:

```sh
python3 -m http.server 8080
```

Then open <http://localhost:8080>.
