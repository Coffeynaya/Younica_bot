// 1) Укажите username Telegram-бота без символа "@"
// 2) При необходимости замените на ваш production username
const TELEGRAM_BOT_USERNAME = "Younica_bot";

const telegramLink = `https://t.me/${TELEGRAM_BOT_USERNAME}`;

const botLink = document.getElementById("botLink");
const botPanelLink = document.getElementById("botPanelLink");
const botToggle = document.getElementById("botToggle");
const botClose = document.getElementById("botClose");
const botPanel = document.getElementById("botPanel");

if (!botLink || !botPanelLink || !botToggle || !botClose || !botPanel) {
  throw new Error("Bot widget elements were not found in the page.");
}

botLink.href = telegramLink;
botPanelLink.href = telegramLink;

const setOpenState = (isOpen) => {
  botPanel.dataset.open = String(isOpen);
  botPanel.setAttribute("aria-hidden", String(!isOpen));
  botToggle.setAttribute("aria-expanded", String(isOpen));
};

setOpenState(false);

botToggle.addEventListener("click", () => {
  const isOpen = botPanel.dataset.open === "true";
  setOpenState(!isOpen);
});

botClose.addEventListener("click", () => {
  setOpenState(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setOpenState(false);
  }
});
