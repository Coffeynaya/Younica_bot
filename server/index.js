'use strict';

const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { processMessage } = require('./bot');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Слишком много запросов. Подождите минуту и попробуйте снова.' }
});

app.post('/api/chat', chatLimiter, (req, res) => {
  const { message } = req.body;

  if (typeof message !== 'string') {
    return res.status(400).json({ error: 'Поле message должно быть строкой.' });
  }

  const { reply, intent } = processMessage(message);

  const delay = Math.floor(Math.random() * 400) + 300;
  setTimeout(() => {
    res.json({
      reply,
      intent,
      timestamp: new Date().toISOString()
    });
  }, delay);
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
