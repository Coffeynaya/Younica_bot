import { Telegraf, Markup } from "telegraf";
import { answerWithLLM, llmStatus } from "./llm.js";

function mustEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const MENU = {
  material: "📚 Материалы",
  ask: "❓ Задать вопрос",
  leave: "📩 Оставить заявку",
  services: "🎯 Услуги",
};

function mainKeyboard() {
  return Markup.keyboard([
    [MENU.services, MENU.ask],
    [MENU.leave, MENU.material],
  ])
    .resize()
    .persistent();
}

function getMaterialText(db) {
  return db.settings.get("material_text") || "";
}

function getMaterialCaption(db) {
  return db.settings.get("material_caption") || "";
}

function getMaterialFile(db, slot) {
  const key = slot === 2 ? "material_file_2" : "material_file_1";
  return db.settings.get(key) || "";
}

function materialFallbackText() {
  return [
    "Сейчас материал обновляется.",
    "Оставьте заявку — менеджер пришлёт актуальные материалы и рекомендации.",
  ].join("\n");
}

async function sendMaterial(ctx, text) {
  const t = String(text || "").trim();
  if (!t) return ctx.reply(materialFallbackText(), mainKeyboard());

  if (t.length > 3500) {
    await ctx.reply(
      "Отправляю материал файлом (так удобнее — он большой).",
      mainKeyboard()
    );
    return ctx.replyWithDocument(
      { source: Buffer.from(t, "utf8"), filename: "younica-material.txt" },
      { caption: "Полезный материал от Younica Digital", parse_mode: "HTML" }
    );
  }
  return ctx.reply(t, mainKeyboard());
}

async function sendMaterialFile(ctx, { filename, caption }) {
  if (!filename) return false;
  const safe = String(filename).replaceAll("..", "_").replaceAll("/", "_");
  const path = `data/materials/${safe}`;
  try {
    await ctx.replyWithDocument(
      { source: path, filename: safe },
      { caption: caption || "Полезный материал от Younica Digital" }
    );
    return true;
  } catch {
    return false;
  }
}

const SERVICES_TEXT = [
  "Мы помогаем выстроить маркетинг так, чтобы заявки и продажи были прогнозируемыми: стратегия, реклама, аналитика и рост.",
  "Можем подключиться точечно (аудит) или взять «под ключ».",
  "",
  "Напишите, что вас интересует, или оставьте заявку — менеджер свяжется с вами и подскажет лучший вариант.",
].join("\n");

const ERROR_REPLIES = [
  "Не получилось сформировать ответ. Попробуйте переформулировать вопрос, или я могу записать вас на созвон — менеджер ответит лично.",
  "Что-то пошло не так с ответом. Напишите вопрос чуть иначе, или оставьте заявку — менеджер разберётся.",
  "К сожалению, не удалось ответить. Если вопрос сложный — это как раз повод обсудить его на бесплатной консультации.",
  "Упс, не смог обработать вопрос. Попробуйте ещё раз или напишите «Оставить заявку» — менеджер поможет.",
];

function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

const MAX_HISTORY = 10;

function getTgHistory(db, userId) {
  try {
    const raw = db.settings.get(`tg_history:${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addTgMessage(db, userId, role, text) {
  const history = getTgHistory(db, userId);
  history.push({ role, text });
  while (history.length > MAX_HISTORY) history.shift();
  db.settings.set(`tg_history:${userId}`, JSON.stringify(history));
}

async function answerUserQuestion(ctx, { db, txt }) {
  const status = llmStatus();
  if (!status.openai && !status.claude && !status.gigachat) {
    return ctx.reply(
      "Сейчас AI-ответы не подключены (нет ключей). Можете оставить заявку — менеджер ответит.",
      mainKeyboard()
    );
  }

  const faqPairs = db.faq.active().map((x) => ({
    question: x.question,
    answer: x.answer,
  }));

  const userId = ctx.from.id;
  const chatHistory = getTgHistory(db, userId);

  addTgMessage(db, userId, "user", txt);

  try {
    const ans = await answerWithLLM({
      question: txt,
      faqPairs,
      chatHistory,
    });
    if (!ans) throw new Error("empty");

    addTgMessage(db, userId, "assistant", ans);

    return ctx.reply(ans, mainKeyboard());
  } catch {
    return ctx.reply(
      getRandomItem(ERROR_REPLIES),
      mainKeyboard()
    );
  }
}

function leadSummary(lead, leadId) {
  const lines = [
    `🆕 Новая заявка #${leadId}`,
    lead.name ? `Имя: ${lead.name}` : null,
    lead.phone ? `Телефон: ${lead.phone}` : null,
    lead.email ? `Email: ${lead.email}` : null,
    lead.message ? `Сообщение: ${lead.message}` : null,
    lead.tg_username ? `Telegram: @${lead.tg_username}` : null,
    lead.tg_user_id ? `UserID: ${lead.tg_user_id}` : null,
  ].filter(Boolean);
  return lines.join("\n");
}

export async function createBot({ db }) {
  const token = mustEnv("TELEGRAM_BOT_TOKEN");
  const bot = new Telegraf(token);

  const managerChatId = process.env.MANAGER_CHAT_ID?.trim() || null;

  try {
    await bot.telegram.setMyCommands([
      { command: "start", description: "Начать" },
      { command: "material", description: "Получить полезный материал" },
      { command: "chatid", description: "Показать chat_id (для группы)" },
      { command: "manager_test", description: "Тест отправки в группу" },
    ]);
  } catch {
    // ignore
  }

  bot.command("manager_test", async (ctx) => {
    if (!managerChatId) {
      return ctx.reply(
        "MANAGER_CHAT_ID не задан в .env. Добавьте его и перезапустите сервис.",
        mainKeyboard()
      );
    }
    try {
      await ctx.telegram.sendMessage(
        managerChatId,
        `✅ Тестовое сообщение от бота.\nchat_id (назначение): ${managerChatId}\nвремя: ${new Date().toISOString()}`
      );
      return ctx.reply("Ок, тестовое сообщение отправлено в группу.", mainKeyboard());
    } catch (e) {
      return ctx.reply(
        `Не получилось отправить в группу. Проверьте, что бот добавлен в чат и у него есть право писать.\nОшибка: ${String(e?.message || e)}`,
        mainKeyboard()
      );
    }
  });

  bot.command("material", async (ctx) => {
    try {
      const caption = getMaterialCaption(db);
      const f1 = getMaterialFile(db, 1);
      const f2 = getMaterialFile(db, 2);
      if (f1 && f2) {
        return ctx.reply(
          "Какой материал отправить?",
          Markup.inlineKeyboard([
            [
              Markup.button.callback("Материал 1", "material:1"),
              Markup.button.callback("Материал 2", "material:2"),
            ],
          ])
        );
      }
      if (f1 || f2) {
        const sent = await sendMaterialFile(ctx, {
          filename: f1 || f2,
          caption,
        });
        if (sent) return;
      }
      const text = getMaterialText(db) || materialFallbackText();
      return await sendMaterial(ctx, text);
    } catch (e) {
      return ctx.reply(
        `Не получилось отправить материал. Попробуйте ещё раз.\nОшибка: ${String(e?.message || e)}`,
        mainKeyboard()
      );
    }
  });

  bot.action(/^material:(1|2)$/, async (ctx) => {
    const slot = Number(ctx.match[1]);
    const caption = getMaterialCaption(db);
    const filename = getMaterialFile(db, slot);
    try {
      await ctx.answerCbQuery();
      const sent = await sendMaterialFile(ctx, { filename, caption });
      if (sent) return;
      const text = getMaterialText(db) || materialFallbackText();
      return await sendMaterial(ctx, text);
    } catch (e) {
      try {
        await ctx.answerCbQuery("Ошибка отправки", { show_alert: true });
      } catch {}
      return ctx.reply(
        `Не получилось отправить материал.\nОшибка: ${String(e?.message || e)}`,
        mainKeyboard()
      );
    }
  });

  bot.command("chatid", async (ctx) => {
    const chat = ctx.chat;
    if (!chat) return;
    return ctx.reply(
      `chat_id: ${chat.id}\nТип: ${chat.type}\nЭто значение можно вставить в MANAGER_CHAT_ID.`,
      mainKeyboard()
    );
  });

  bot.on("new_chat_members", async (ctx) => {
    try {
      const newMembers = ctx.message?.new_chat_members || [];
      const me = await ctx.telegram.getMe();
      const addedMe = newMembers.some((m) => m.id === me.id);
      if (!addedMe) return;
      return ctx.reply(
        `Спасибо, что добавили меня в группу.\nchat_id: ${ctx.chat.id}\n\nЧтобы включить пересылку заявок менеджеру, вставьте это значение в MANAGER_CHAT_ID в .env и перезапустите сервис.\n\nКоманда для проверки: /chatid`,
        mainKeyboard()
      );
    } catch {
      return;
    }
  });

  bot.start(async (ctx) => {
    await ctx.reply(
      "Здравствуйте! Я бот Younica Digital. Подскажите, что вам нужно — отвечу или помогу оставить заявку менеджеру.",
      mainKeyboard()
    );
    const material = getMaterialText(db);
    const caption = getMaterialCaption(db);
    const f1 = getMaterialFile(db, 1);
    if (f1) {
      await ctx.reply("Кстати, вот полезный материал — может пригодиться:", mainKeyboard());
      await sendMaterialFile(ctx, { filename: f1, caption });
    } else if (material) {
      await ctx.reply("Кстати, вот полезный материал — может пригодиться:", mainKeyboard());
      try { await sendMaterial(ctx, material); } catch {}
    }
  });

  bot.hears(Object.values(MENU), async (ctx) => {
    const text = ctx.message?.text;
    if (!text) return;

    if (text === MENU.services) {
      return ctx.reply(SERVICES_TEXT, mainKeyboard());
    }

    if (text === MENU.ask) {
      db.settings.set(`state:${ctx.from.id}`, "awaiting_question");
      return ctx.reply("Конечно. Напишите ваш вопрос одним сообщением — я отвечу.", mainKeyboard());
    }

    if (text === MENU.leave) {
      db.settings.set(`state:${ctx.from.id}`, "lead_name");
      db.settings.set(`lead:${ctx.from.id}`, JSON.stringify({}));
      return ctx.reply("Давайте оформим заявку. Как к вам обращаться? (имя)", mainKeyboard());
    }

    if (text === MENU.material) {
      try {
        const caption = getMaterialCaption(db);
        const f1 = getMaterialFile(db, 1);
        const f2 = getMaterialFile(db, 2);
        if (f1 && f2) {
          return ctx.reply(
            "Какой материал отправить?",
            Markup.inlineKeyboard([
              [
                Markup.button.callback("Материал 1", "material:1"),
                Markup.button.callback("Материал 2", "material:2"),
              ],
            ])
          );
        }
        if (f1 || f2) {
          const sent = await sendMaterialFile(ctx, {
            filename: f1 || f2,
            caption,
          });
          if (sent) return;
        }
        const material = getMaterialText(db) || materialFallbackText();
        return await sendMaterial(ctx, material);
      } catch (e) {
        return ctx.reply(
          `Не получилось отправить материал. Попробуйте ещё раз.\nОшибка: ${String(
            e?.message || e
          )}`,
          mainKeyboard()
        );
      }
    }
  });

  bot.on("text", async (ctx) => {
    const state = db.settings.get(`state:${ctx.from.id}`) || "";
    const txt = ctx.message?.text?.trim();
    if (!txt) return;

    // Lead Flow
    if (state.startsWith("lead_")) {
      const raw = db.settings.get(`lead:${ctx.from.id}`) || "{}";
      const lead = JSON.parse(raw);

      if (state === "lead_name") {
        lead.name = txt;
        db.settings.set(`lead:${ctx.from.id}`, JSON.stringify(lead));
        db.settings.set(`state:${ctx.from.id}`, "lead_phone");
        return ctx.reply("Телефон для связи? (можно с +)", mainKeyboard());
      }

      if (state === "lead_phone") {
        lead.phone = txt;
        db.settings.set(`lead:${ctx.from.id}`, JSON.stringify(lead));
        db.settings.set(`state:${ctx.from.id}`, "lead_email");
        return ctx.reply('Email (если не хотите указывать — напишите "Нет")', mainKeyboard());
      }

      if (state === "lead_email") {
        if (txt.toLowerCase() !== "нет") lead.email = txt;
        db.settings.set(`lead:${ctx.from.id}`, JSON.stringify(lead));
        db.settings.set(`state:${ctx.from.id}`, "lead_message");
        return ctx.reply(
          "Коротко опишите запрос (что нужно, ниша/продукт, регион, бюджет если есть).",
          mainKeyboard()
        );
      }

      if (state === "lead_message") {
        lead.message = txt;
        lead.tg_user_id = String(ctx.from.id);
        lead.tg_username = ctx.from.username || null;

        const leadId = db.leads.create(lead);
        db.settings.set(`state:${ctx.from.id}`, "");
        db.settings.set(`lead:${ctx.from.id}`, "{}");

        const summary = leadSummary(lead, leadId);

        if (managerChatId) {
          try {
            await ctx.telegram.sendMessage(managerChatId, summary);
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error("[manager_forward] failed", {
              managerChatId,
              error: String(e?.message || e),
            });
          }
        }

        return ctx.reply(
          "Спасибо! Заявка принята. В ближайшее время менеджер свяжется с вами и уточнит детали.",
          mainKeyboard()
        );
      }
    }

    // Q&A
    if (state === "awaiting_question") {
      db.settings.set(`state:${ctx.from.id}`, "");
      return answerUserQuestion(ctx, { db, txt });
    }

    // Default: free-form question (no explicit mode)
    return answerUserQuestion(ctx, { db, txt });
  });

  return bot;
}
