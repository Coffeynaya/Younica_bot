# Инструкция по обслуживанию бота Younica Digital

## Подключение к серверу

```bash
ssh root@193.233.103.67
```
Введите пароль. Если появится OpenClaw — нажмите **Ctrl+D**.

Все файлы бота находятся в: `/opt/Younica-ai-bot/`

---

## 1. Полезные материалы (Бонус 1, Бонус 2)

### Где хранятся файлы
```
/opt/Younica-ai-bot/data/materials/
```

### Заменить файл материала

**Шаг 1:** Загрузите новый файл на сервер (с вашего Mac):
```bash
scp /путь/к/файлу/новый_материал.pdf root@193.233.103.67:/opt/Younica-ai-bot/data/materials/
```

**Шаг 2:** Обновите название файла в базе данных (на сервере):
```bash
cd /opt/Younica-ai-bot
# Для Бонуса 1:
sqlite3 data/bot.db "UPDATE settings SET value='новый_материал.pdf' WHERE key='material_file_1';"

# Для Бонуса 2:
sqlite3 data/bot.db "UPDATE settings SET value='новый_материал2.pdf' WHERE key='material_file_2';"
```

**Шаг 3:** Перезапустите бота:
```bash
cd /opt/Younica-ai-bot && docker compose restart
```

### Изменить подпись к материалам
```bash
sqlite3 data/bot.db "UPDATE settings SET value='Ваша новая подпись' WHERE key='material_caption';"
```

### Изменить текстовый материал (если нет файла)
```bash
sqlite3 data/bot.db "UPDATE settings SET value='Текст нового материала...' WHERE key='material_text';"
```

### Посмотреть текущие настройки материалов
```bash
sqlite3 data/bot.db "SELECT key, value FROM settings WHERE key LIKE 'material%';"
```

---

## 2. FAQ (база знаний бота)

FAQ — это пары "вопрос-ответ", которые бот использует для более точных ответов через AI.

### Посмотреть все FAQ
```bash
sqlite3 data/bot.db "SELECT id, question, answer, active FROM faq;"
```

### Добавить новый FAQ
```bash
sqlite3 data/bot.db "INSERT INTO faq (question, answer, active) VALUES ('Сколько стоит SMM?', 'Стоимость SMM зависит от объёма работы. Базовый пакет от 30 000 руб/мес.', 1);"
```

### Обновить существующий FAQ (по ID)
```bash
# Обновить ответ для FAQ с id=3
sqlite3 data/bot.db "UPDATE faq SET answer='Новый ответ на вопрос' WHERE id=3;"
```

### Отключить FAQ (не удаляя)
```bash
sqlite3 data/bot.db "UPDATE faq SET active=0 WHERE id=3;"
```

### Включить FAQ обратно
```bash
sqlite3 data/bot.db "UPDATE faq SET active=1 WHERE id=3;"
```

### Удалить FAQ
```bash
sqlite3 data/bot.db "DELETE FROM faq WHERE id=3;"
```

---

## 3. Просмотр заявок (лидов)

### Все заявки
```bash
sqlite3 -header -column data/bot.db "SELECT * FROM leads ORDER BY id DESC LIMIT 20;"
```

### Заявки за сегодня
```bash
sqlite3 -header -column data/bot.db "SELECT * FROM leads WHERE created_at >= date('now') ORDER BY id DESC;"
```

### Количество заявок
```bash
sqlite3 data/bot.db "SELECT COUNT(*) FROM leads;"
```

---

## 4. Системный промпт AI (поведение бота)

Промпт определяет, как бот общается с клиентами. Он находится в файле:
```
/opt/Younica-ai-bot/src/lib/llm.js
```

### Посмотреть текущий промпт
```bash
grep -A 30 "const PROMPT" /opt/Younica-ai-bot/src/lib/llm.js
```

### Редактировать промпт
```bash
nano /opt/Younica-ai-bot/src/lib/llm.js
```
Найдите массив `const PROMPT = [...]` и отредактируйте строки.

После редактирования — пересоберите:
```bash
cd /opt/Younica-ai-bot && docker compose build --no-cache && docker compose up -d
```

---

## 5. Сайт (younica.ru) — виджет чата

Виджет чата на сайте работает отдельно от Telegram-бота. Код виджета встроен в HTML-код страницы через Tilda.

### Где находится код виджета
Виджет генерируется сервером по адресу `https://younica.ru`. Его логика — в файлах:
```
/opt/Younica-ai-bot/src/lib/webchatApi.js  — API и виджет
/opt/Younica-ai-bot/src/lib/llm.js         — AI-ответы (общий для ТГ и сайта)
```

### Изменить приветственное сообщение виджета
Найдите в `webchatApi.js` текст приветствия и отредактируйте:
```bash
nano /opt/Younica-ai-bot/src/lib/webchatApi.js
```

### Изменить кнопки-подсказки (быстрые вопросы)
Ищите в `webchatApi.js` массив с текстами кнопок (типа "Услуги", "Цены" и т.д.) и измените.

После любых изменений:
```bash
cd /opt/Younica-ai-bot && docker compose build --no-cache && docker compose up -d
```

---

## 6. Настройки окружения (.env)

Файл настроек: `/opt/Younica-ai-bot/.env`

### Основные переменные
| Переменная | Описание |
|------------|----------|
| `TELEGRAM_BOT_TOKEN` | Токен Telegram-бота (от @BotFather) |
| `MANAGER_CHAT_ID` | ID чата/группы для пересылки заявок |
| `OPENAI_API_KEY` | Ключ API (через proxyapi.ru) |
| `OPENAI_BASE_URL` | `https://api.proxyapi.ru/openai/v1` |
| `LLM_PROVIDER_ORDER` | Порядок провайдеров AI (`openai`) |
| `PORT` | Порт сервера (по умолчанию 3000) |

### Редактировать
```bash
nano /opt/Younica-ai-bot/.env
```

После изменения .env:
```bash
cd /opt/Younica-ai-bot && docker compose restart
```

---

## 7. Типичные операции

### Перезапуск бота (без пересборки)
```bash
cd /opt/Younica-ai-bot && docker compose restart
```

### Полная пересборка (после изменения кода)
```bash
cd /opt/Younica-ai-bot && docker compose down && docker compose build --no-cache && docker compose up -d
```

### Посмотреть логи бота
```bash
cd /opt/Younica-ai-bot && docker compose logs -f --tail=50
```

### Проверить, работает ли бот
```bash
docker compose ps
```
Оба контейнера (`younica_ai_bot` и `younica_caddy`) должны быть `Running`.

### Проверить баланс ProxyAPI
Зайдите на https://proxyapi.ru в личный кабинет.

---

## 8. Обновление бота из репозитория

Если я (или другой разработчик) выложу обновления в GitHub:

```bash
cd /opt/Younica-ai-bot

# Скачать обновлённый bot.js
curl -o src/lib/bot.js https://raw.githubusercontent.com/Coffeynaya/Younica_bot/cursor/fix-telegram-bot-ux-5d9a/src/lib/bot.js

# Пересобрать
docker compose build --no-cache && docker compose up -d
```

---

## 9. Резервное копирование

### Бэкап базы данных
```bash
cp /opt/Younica-ai-bot/data/bot.db /opt/Younica-ai-bot/data/bot.db.backup.$(date +%Y%m%d)
```

### Бэкап всего проекта
```bash
tar czf /root/younica-bot-backup-$(date +%Y%m%d).tar.gz /opt/Younica-ai-bot/
```

---

## Быстрая шпаргалка

| Задача | Команда |
|--------|---------|
| Зайти на сервер | `ssh root@193.233.103.67` |
| Перейти в папку бота | `cd /opt/Younica-ai-bot` |
| Посмотреть логи | `docker compose logs -f --tail=50` |
| Перезапустить | `docker compose restart` |
| Пересобрать | `docker compose build --no-cache && docker compose up -d` |
| Бэкап БД | `cp data/bot.db data/bot.db.backup` |
| Посмотреть FAQ | `sqlite3 data/bot.db "SELECT * FROM faq;"` |
| Посмотреть заявки | `sqlite3 -header -column data/bot.db "SELECT * FROM leads ORDER BY id DESC LIMIT 20;"` |
| Посмотреть материалы | `sqlite3 data/bot.db "SELECT * FROM settings WHERE key LIKE 'material%';"` |
