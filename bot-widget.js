(function () {
  "use strict";

  var defaults = {
    enabled: true,
    apiUrl: "/api/bot",
    title: "Бот-помощник",
    sendButtonLabel: "Отправить",
    launcherLabel: "Открыть чат с ботом",
    welcomeMessage: "Здравствуйте! Чем могу помочь?",
    placeholder: "Введите сообщение...",
    themeColor: "#2563eb",
    errorMessage: "Не удалось связаться с ботом. Попробуйте еще раз.",
    position: "right"
  };

  var config = Object.assign({}, defaults, window.BOT_WIDGET_CONFIG || {});

  if (!config.enabled) {
    return;
  }

  var root = document.createElement("div");
  root.className = "bot-widget";
  root.setAttribute("data-position", config.position === "left" ? "left" : "right");

  var launcher = document.createElement("button");
  launcher.type = "button";
  launcher.className = "bot-widget__launcher";
  launcher.setAttribute("aria-label", config.launcherLabel);
  launcher.setAttribute("aria-expanded", "false");
  launcher.innerHTML = "<span>💬</span>";

  var panel = document.createElement("section");
  panel.className = "bot-widget__panel bot-widget__panel--hidden";
  panel.setAttribute("aria-label", config.title);

  var header = document.createElement("header");
  header.className = "bot-widget__header";
  header.innerHTML =
    "<strong>" +
    escapeHtml(config.title) +
    "</strong><button type=\"button\" class=\"bot-widget__close\" aria-label=\"Закрыть\">×</button>";

  var messages = document.createElement("div");
  messages.className = "bot-widget__messages";
  messages.setAttribute("aria-live", "polite");

  var form = document.createElement("form");
  form.className = "bot-widget__form";
  form.innerHTML =
    "<input type=\"text\" class=\"bot-widget__input\" maxlength=\"2000\" placeholder=\"" +
    escapeHtml(config.placeholder) +
    "\" required />" +
    "<button type=\"submit\" class=\"bot-widget__submit\">" +
    escapeHtml(config.sendButtonLabel) +
    "</button>";

  panel.appendChild(header);
  panel.appendChild(messages);
  panel.appendChild(form);
  root.appendChild(panel);
  root.appendChild(launcher);
  document.body.appendChild(root);

  injectStyles(config.themeColor);

  var closeButton = panel.querySelector(".bot-widget__close");
  var input = panel.querySelector(".bot-widget__input");
  var submitButton = panel.querySelector(".bot-widget__submit");
  var isOpen = false;
  var sessionId = getSessionId();

  addMessage(config.welcomeMessage, "bot");

  launcher.addEventListener("click", function () {
    isOpen = !isOpen;
    panel.classList.toggle("bot-widget__panel--hidden", !isOpen);
    launcher.setAttribute("aria-expanded", String(isOpen));
    if (isOpen) {
      input.focus();
    }
  });

  closeButton.addEventListener("click", function () {
    isOpen = false;
    panel.classList.add("bot-widget__panel--hidden");
    launcher.setAttribute("aria-expanded", "false");
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var value = input.value.trim();
    if (!value) {
      return;
    }
    input.value = "";
    addMessage(value, "user");
    sendMessage(value);
  });

  function sendMessage(message) {
    var typingId = addMessage("Бот печатает...", "bot", true);
    input.disabled = true;
    submitButton.disabled = true;

    fetch(config.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: message,
        sessionId: sessionId,
        pageUrl: window.location.href,
        userAgent: navigator.userAgent
      })
    })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("API returned status " + response.status);
        }
        return response.json();
      })
      .then(function (payload) {
        removeMessage(typingId);
        renderBotResponse(payload);
      })
      .catch(function () {
        removeMessage(typingId);
        addMessage(config.errorMessage, "bot");
      })
      .finally(function () {
        input.disabled = false;
        submitButton.disabled = false;
        input.focus();
      });
  }

  function renderBotResponse(payload) {
    if (!payload) {
      addMessage("Пустой ответ от сервера.", "bot");
      return;
    }

    if (typeof payload.reply === "string" && payload.reply.trim()) {
      addMessage(payload.reply, "bot");
      return;
    }

    if (Array.isArray(payload.messages) && payload.messages.length > 0) {
      payload.messages.forEach(function (messageItem) {
        if (typeof messageItem === "string") {
          addMessage(messageItem, "bot");
          return;
        }
        if (messageItem && typeof messageItem.text === "string") {
          addMessage(messageItem.text, "bot");
        }
      });
      return;
    }

    addMessage("Бот не вернул сообщение в ожидаемом формате.", "bot");
  }

  function addMessage(text, author, isTransient) {
    var id = "msg-" + Math.random().toString(36).slice(2);
    var item = document.createElement("div");
    item.className = "bot-widget__message bot-widget__message--" + author;
    item.setAttribute("data-message-id", id);
    if (isTransient) {
      item.setAttribute("data-transient", "true");
    }
    item.textContent = text;
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
    return id;
  }

  function removeMessage(messageId) {
    var node = messages.querySelector("[data-message-id=\"" + messageId + "\"]");
    if (node) {
      node.remove();
    }
  }

  function getSessionId() {
    var storageKey = "bot-widget-session-id";
    var existing = window.localStorage.getItem(storageKey);
    if (existing) {
      return existing;
    }
    var id = "session-" + Date.now() + "-" + Math.random().toString(36).slice(2);
    window.localStorage.setItem(storageKey, id);
    return id;
  }

  function injectStyles(themeColor) {
    var style = document.createElement("style");
    style.textContent =
      ".bot-widget{position:fixed;bottom:24px;z-index:1000;font-family:Arial,sans-serif}" +
      ".bot-widget[data-position='right']{right:24px}" +
      ".bot-widget[data-position='left']{left:24px}" +
      ".bot-widget__launcher{width:56px;height:56px;border:none;border-radius:50%;cursor:pointer;background:" +
      themeColor +
      ";color:#fff;box-shadow:0 8px 24px rgba(15,23,42,.24);font-size:22px}" +
      ".bot-widget__panel{width:min(360px,calc(100vw - 32px));height:500px;max-height:70vh;background:#fff;border-radius:14px;box-shadow:0 16px 40px rgba(15,23,42,.28);overflow:hidden;display:flex;flex-direction:column;margin-bottom:12px}" +
      ".bot-widget__panel--hidden{display:none}" +
      ".bot-widget__header{display:flex;justify-content:space-between;align-items:center;padding:12px 14px;background:" +
      themeColor +
      ";color:#fff}" +
      ".bot-widget__close{border:none;background:transparent;color:#fff;font-size:24px;cursor:pointer;line-height:1}" +
      ".bot-widget__messages{flex:1;padding:12px;background:#f8fafc;overflow-y:auto;display:flex;flex-direction:column;gap:10px}" +
      ".bot-widget__message{max-width:85%;padding:10px 12px;border-radius:12px;white-space:pre-wrap;line-height:1.35}" +
      ".bot-widget__message--user{align-self:flex-end;background:#dbeafe}" +
      ".bot-widget__message--bot{align-self:flex-start;background:#fff;border:1px solid #e2e8f0}" +
      ".bot-widget__form{display:flex;gap:8px;padding:12px;border-top:1px solid #e2e8f0}" +
      ".bot-widget__input{flex:1;padding:9px 10px;border:1px solid #cbd5e1;border-radius:8px;font-size:14px}" +
      ".bot-widget__submit{border:none;border-radius:8px;padding:0 12px;background:" +
      themeColor +
      ";color:#fff;cursor:pointer}";
    document.head.appendChild(style);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();
