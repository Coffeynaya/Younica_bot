(function () {
  'use strict';

  const API_URL = '/api/chat';

  const widget = document.getElementById('chatWidget');
  const chatWindow = document.getElementById('chatWindow');
  const toggleBtn = document.getElementById('chatToggle');
  const closeBtn = document.getElementById('chatClose');
  const messagesEl = document.getElementById('chatMessages');
  const inputEl = document.getElementById('chatInput');
  const sendBtn = document.getElementById('chatSend');
  const badge = document.getElementById('chatBadge');
  const iconOpen = toggleBtn.querySelector('.chat-toggle__icon--open');
  const iconClose = toggleBtn.querySelector('.chat-toggle__icon--close');

  let isOpen = false;
  let isBotTyping = false;

  function toggleChat(open) {
    isOpen = (open !== undefined) ? open : !isOpen;
    chatWindow.classList.toggle('open', isOpen);
    iconOpen.style.display = isOpen ? 'none' : 'flex';
    iconClose.style.display = isOpen ? 'flex' : 'none';

    if (isOpen) {
      hideBadge();
      setTimeout(() => inputEl.focus(), 300);
      scrollToBottom();
    }
  }

  function hideBadge() {
    badge.classList.add('hidden');
  }

  function formatTime(date) {
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }

  function createMessageEl(text, role) {
    const wrap = document.createElement('div');
    wrap.className = `message message--${role}`;

    if (role === 'bot') {
      const avatar = document.createElement('div');
      avatar.className = 'message__avatar';
      avatar.textContent = '🤖';
      wrap.appendChild(avatar);
    }

    const content = document.createElement('div');
    content.style.display = 'flex';
    content.style.flexDirection = 'column';
    content.style.gap = '4px';

    const bubble = document.createElement('div');
    bubble.className = 'message__bubble';
    bubble.textContent = text;

    const time = document.createElement('span');
    time.className = 'message__time';
    time.textContent = formatTime(new Date());

    if (role === 'user') {
      content.style.alignItems = 'flex-end';
    } else {
      content.style.alignItems = 'flex-start';
    }

    content.appendChild(bubble);
    content.appendChild(time);
    wrap.appendChild(content);

    return wrap;
  }

  function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.id = 'typingIndicator';

    const avatar = document.createElement('div');
    avatar.className = 'typing-indicator__avatar';
    avatar.textContent = '🤖';

    const bubble = document.createElement('div');
    bubble.className = 'typing-indicator__bubble';

    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('span');
      dot.className = 'typing-indicator__dot';
      bubble.appendChild(dot);
    }

    indicator.appendChild(avatar);
    indicator.appendChild(bubble);
    messagesEl.appendChild(indicator);
    scrollToBottom();
    return indicator;
  }

  function removeTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) indicator.remove();
  }

  function scrollToBottom() {
    requestAnimationFrame(() => {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    });
  }

  function appendMessage(text, role) {
    const el = createMessageEl(text, role);
    messagesEl.appendChild(el);
    scrollToBottom();
    return el;
  }

  function setSendDisabled(disabled) {
    sendBtn.disabled = disabled;
    inputEl.disabled = disabled;
  }

  async function sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed || isBotTyping) return;

    isBotTyping = true;
    setSendDisabled(true);
    inputEl.value = '';

    appendMessage(trimmed, 'user');

    const typing = showTypingIndicator();

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      removeTypingIndicator();
      appendMessage(data.reply, 'bot');
    } catch (err) {
      removeTypingIndicator();
      appendMessage(
        'Извините, произошла ошибка при отправке. Попробуйте ещё раз.',
        'bot'
      );
      console.error('[Chat] Error:', err.message);
    } finally {
      isBotTyping = false;
      setSendDisabled(false);
      if (isOpen) {
        setTimeout(() => inputEl.focus(), 50);
      }
    }
  }

  // Event listeners
  toggleBtn.addEventListener('click', () => toggleChat());
  closeBtn.addEventListener('click', () => toggleChat(false));

  sendBtn.addEventListener('click', () => sendMessage(inputEl.value));

  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputEl.value);
    }
  });

  document.querySelectorAll('.chat-suggestion').forEach((btn) => {
    btn.addEventListener('click', () => {
      const text = btn.dataset.text;
      if (!isOpen) toggleChat(true);
      sendMessage(text);
    });
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (isOpen && !widget.contains(e.target)) {
      toggleChat(false);
    }
  });

  // Keyboard accessibility
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) toggleChat(false);
  });

  // Show badge after delay to draw attention
  setTimeout(() => {
    if (!isOpen) {
      badge.classList.remove('hidden');
    }
  }, 3000);

})();
