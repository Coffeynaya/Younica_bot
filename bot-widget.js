const BOT_CONFIG = {
  botUsername: 'Younica_bot',
  botUrl: 'https://t.me/Younica_bot',
  initialMessage: 'Здравствуйте! Я бот Younica. Чем могу помочь?',
};

const resolveConfig = () => {
  const config = {
    ...BOT_CONFIG,
    ...(window.YOUNICA_BOT_CONFIG || {}),
  };

  return {
    ...config,
    botUrl: config.botUrl || `https://t.me/${config.botUsername}`,
  };
};

const updateBotLinks = (config) => {
  const links = document.querySelectorAll('[data-bot-link]');

  links.forEach((link) => {
    link.setAttribute('href', config.botUrl);
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
  });

  const botNames = document.querySelectorAll('[data-bot-name]');
  botNames.forEach((element) => {
    element.textContent = `@${config.botUsername}`;
  });
};

const createBotWidget = (config) => {
  const widget = document.createElement('aside');
  widget.className = 'bot-widget';
  widget.setAttribute('aria-label', 'Виджет Telegram-бота');
  widget.innerHTML = `
    <div class="bot-widget-card" id="bot-widget-card" hidden>
      <h2>Нужна помощь?</h2>
      <p>${config.initialMessage}</p>
      <a class="button button-primary" data-bot-link href="${config.botUrl}" target="_blank" rel="noopener noreferrer">
        Написать боту
      </a>
    </div>
    <button class="bot-widget-toggle" type="button" aria-expanded="false" aria-controls="bot-widget-card">
      <span aria-hidden="true">?</span>
      <span class="visually-hidden">Открыть виджет бота</span>
    </button>
  `;

  const card = widget.querySelector('.bot-widget-card');
  const toggle = widget.querySelector('.bot-widget-toggle');

  const setWidgetOpen = (isOpen) => {
    card.hidden = !isOpen;
    toggle.setAttribute('aria-expanded', String(isOpen));
  };

  toggle.addEventListener('click', () => {
    setWidgetOpen(card.hidden);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setWidgetOpen(false);
    }
  });

  document.body.appendChild(widget);
};

const initBotIntegration = () => {
  const config = resolveConfig();

  updateBotLinks(config);
  createBotWidget(config);

  updateBotLinks(config);
};

document.addEventListener('DOMContentLoaded', initBotIntegration);
