(function () {
  "use strict";

  const currentScript = document.currentScript;
  const CONFIG = {
    botName: currentScript?.dataset.botName || "Younica Bot",
    greeting: currentScript?.dataset.greeting || "Здравствуйте! Я Younica Bot. Чем могу помочь?",
    endpoint: currentScript?.dataset.apiEndpoint || window.YOUNICA_BOT_ENDPOINT || "",
    botUrl: currentScript?.dataset.botUrl || window.YOUNICA_BOT_URL || "https://t.me/younica_bot",
    storageKey: "younica-bot-widget-messages",
  };

  const quickReplies = [
    "Расскажите о возможностях",
    "Как подключить бота?",
    "Нужна консультация",
  ];

  const widget = createWidget();
  const toggle = widget.querySelector("[data-bot-toggle]");
  const panel = widget.querySelector("[data-bot-panel]");
  const closeButton = widget.querySelector("[data-bot-close]");
  const messages = widget.querySelector("[data-bot-messages]");
  const form = widget.querySelector("[data-bot-form]");
  const input = widget.querySelector("[data-bot-input]");
  const quickReplyContainer = widget.querySelector("[data-bot-quick-replies]");

  let conversation = loadConversation();

  function createWidget() {
    const container = document.createElement("section");
    container.className = "bot-widget";
    container.setAttribute("data-bot-widget", "");
    container.setAttribute("aria-label", "Чат с ботом");
    container.innerHTML = `
      <div class="bot-panel" data-bot-panel aria-hidden="true">
        <div class="bot-panel-header">
          <div class="bot-title">
            <span class="bot-avatar" aria-hidden="true">Y</span>
            <div>
              <strong>${escapeHtml(CONFIG.botName)}</strong>
              <small>онлайн-помощник</small>
            </div>
          </div>
          <button class="bot-close" type="button" data-bot-close aria-label="Закрыть чат">×</button>
        </div>
        <div class="bot-messages" data-bot-messages aria-live="polite"></div>
        <div class="bot-quick-replies" data-bot-quick-replies></div>
        <form class="bot-form" data-bot-form>
          <input class="bot-input" data-bot-input type="text" name="message" placeholder="Введите сообщение" autocomplete="off" aria-label="Сообщение для бота">
          <button class="bot-send" type="submit" aria-label="Отправить">➜</button>
        </form>
      </div>
      <button class="bot-toggle" type="button" data-bot-toggle aria-label="Открыть чат с ботом" aria-expanded="false">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
          <path d="M5 10.5A6.5 6.5 0 0 1 11.5 4h1A6.5 6.5 0 0 1 19 10.5v.5a6.5 6.5 0 0 1-6.5 6.5H12l-4.5 2v-3.1A6.48 6.48 0 0 1 5 11v-.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
          <path d="M9 10.5h6M9 13.5h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
      </button>
    `;
    document.body.appendChild(container);
    return container;
  }

  function escapeHtml(value) {
    return value.replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[char]);
  }

  function loadConversation() {
    try {
      const storedMessages = window.localStorage.getItem(CONFIG.storageKey);
      if (storedMessages) {
        return JSON.parse(storedMessages);
      }
    } catch (error) {
      // Storage can be unavailable in private contexts; chat still works for the session.
    }

    return [
      {
        role: "bot",
        text: CONFIG.greeting,
      },
    ];
  }

  function saveConversation() {
    try {
      window.localStorage.setItem(CONFIG.storageKey, JSON.stringify(conversation));
    } catch (error) {
      // Ignore storage errors and keep the current in-memory conversation.
    }
  }

  function renderMessages() {
    messages.innerHTML = "";

    conversation.forEach((message) => {
      const bubble = document.createElement("div");
      bubble.className = `bot-message bot-message--${message.role}`;
      bubble.textContent = message.text;
      messages.appendChild(bubble);
    });

    messages.scrollTop = messages.scrollHeight;
  }

  function addMessage(role, text) {
    conversation.push({ role, text });
    saveConversation();
    renderMessages();
  }

  function setOpen(isOpen) {
    widget.classList.toggle("bot-widget--open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
    panel.setAttribute("aria-hidden", String(!isOpen));

    if (isOpen) {
      window.setTimeout(() => input.focus(), 50);
    }
  }

  function renderQuickReplies() {
    quickReplyContainer.innerHTML = "";

    quickReplies.forEach((reply) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "quick-reply";
      button.textContent = reply;
      button.addEventListener("click", () => {
        input.value = reply;
        form.requestSubmit();
      });
      quickReplyContainer.appendChild(button);
    });
  }

  async function sendToEndpoint(text) {
    if (!CONFIG.endpoint) {
      return null;
    }

    const response = await window.fetch(CONFIG.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: text,
        history: conversation.map((message) => ({
          role: message.role,
          content: message.text,
        })),
        source: "site-widget",
      }),
    });

    if (!response.ok) {
      throw new Error(`Bot endpoint returned ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await response.json();
      return data.reply || data.message || "Спасибо! Я получил ваше сообщение.";
    }

    return response.text();
  }

  function fallbackReply() {
    return `Пока сайт не подключен к API бота напрямую. Напишите мне здесь: ${CONFIG.botUrl}`;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const text = input.value.trim();
    if (!text) {
      return;
    }

    input.value = "";
    addMessage("user", text);

    const pendingMessage = {
      role: "bot",
      text: "Печатаю ответ...",
    };
    conversation.push(pendingMessage);
    renderMessages();

    try {
      const reply = (await sendToEndpoint(text)) || fallbackReply();
      pendingMessage.text = reply;
    } catch (error) {
      pendingMessage.text = fallbackReply();
    } finally {
      saveConversation();
      renderMessages();
    }
  }

  toggle.addEventListener("click", () => {
    setOpen(!widget.classList.contains("bot-widget--open"));
  });

  closeButton.addEventListener("click", () => {
    setOpen(false);
  });

  form.addEventListener("submit", handleSubmit);

  document.querySelectorAll("[data-open-bot]").forEach((button) => {
    button.addEventListener("click", () => setOpen(true));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setOpen(false);
    }
  });

  renderQuickReplies();
  renderMessages();
})();
