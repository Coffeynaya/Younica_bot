#!/bin/bash
# Deploy Telegram bot fixes to VPS
# Fixes: 1) Remove "thinking" message, 2) Diversify responses, 3) Add conversation context
#
# Run on the VPS: bash deploy-telegram-fixes.sh

set -e

BOT_DIR="/opt/Younica-ai-bot"
BOT_FILE="$BOT_DIR/src/lib/bot.js"
LLM_FILE="$BOT_DIR/src/lib/llm.js"

echo "=== Telegram Bot Fix Deployment ==="
echo ""

# Check that we're on the VPS
if [ ! -d "$BOT_DIR" ]; then
  echo "ERROR: $BOT_DIR not found. Run this script on the VPS."
  exit 1
fi

# Backup existing files
echo "[1/4] Creating backups..."
cp "$BOT_FILE" "$BOT_FILE.bak.$(date +%Y%m%d%H%M%S)"
cp "$LLM_FILE" "$LLM_FILE.bak.$(date +%Y%m%d%H%M%S)"
echo "  Backups created."

# Patch bot.js - replace the full file
echo "[2/4] Replacing bot.js..."
cp "$(dirname "$0")/src/lib/bot.js" "$BOT_FILE"
echo "  bot.js replaced."

# Patch llm.js - apply targeted changes
echo "[3/4] Patching llm.js..."

# 3a. Add diversity instruction to PROMPT array
if grep -q "РАЗНООБРАЗИЕ" "$LLM_FILE"; then
  echo "  PROMPT diversity instruction already present, skipping."
else
  python3 -c "
import re
with open('$LLM_FILE', 'r') as f:
    content = f.read()

# Add diversity line before the closing bracket of PROMPT array
diversity_line = '  \"РАЗНООБРАЗИЕ: НЕ повторяй одни и те же формулировки про менеджера и созвон. Если в истории диалога ты уже предлагал созвон — в следующем ответе подведи к этому иначе: покажи экспертизу, задай уточняющий вопрос, расскажи мини-кейс, и только потом мягко напомни про консультацию другими словами. Будь живым и естественным собеседником.\",'

# Find the PROMPT array closing bracket and insert before it
# The PROMPT array ends with ];
lines = content.split('\n')
new_lines = []
in_prompt = False
inserted = False
for line in lines:
    if 'const PROMPT' in line:
        in_prompt = True
    if in_prompt and not inserted and line.strip() == '];':
        new_lines.append(diversity_line)
        inserted = True
        in_prompt = False
    new_lines.append(line)

with open('$LLM_FILE', 'w') as f:
    f.write('\n'.join(new_lines))
print('  Added PROMPT diversity instruction.')
"
fi

# 3b. Add chatHistory to answerWithLLM parameters
if grep -q "chatHistory" "$LLM_FILE"; then
  echo "  chatHistory already in llm.js, skipping parameter patch."
else
  python3 -c "
with open('$LLM_FILE', 'r') as f:
    content = f.read()

# Add chatHistory to answerWithLLM function signature
content = content.replace(
    'async function answerWithLLM({ question, faqPairs })',
    'async function answerWithLLM({ question, faqPairs, chatHistory })'
)

# Pass chatHistory to answerOpenAI
content = content.replace(
    'answerOpenAI({ system, question, chatHistory:',
    'answerOpenAI({ system, question, chatHistory,'
)

# If chatHistory is not being passed yet, add it
if 'answerOpenAI({ system, question, chatHistory,' not in content:
    content = content.replace(
        'answerOpenAI({ system, question,',
        'answerOpenAI({ system, question, chatHistory,'
    )

with open('$LLM_FILE', 'w') as f:
    f.write(content)
print('  Added chatHistory parameter to answerWithLLM.')
"
fi

# 3c. Add chatHistory messages to the OpenAI API call
python3 -c "
with open('$LLM_FILE', 'r') as f:
    content = f.read()

# Replace the simple messages array with one that includes history
old_messages = '''messages: [
        { role: \"system\", content: system },
        { role: \"user\", content: question },
      ]'''

new_messages = '''messages: [
        { role: \"system\", content: system },
        ...(chatHistory || []).map(m => ({
          role: m.role === \"user\" ? \"user\" : \"assistant\",
          content: m.text,
        })),
        { role: \"user\", content: question },
      ]'''

if old_messages in content:
    content = content.replace(old_messages, new_messages)
    with open('$LLM_FILE', 'w') as f:
        f.write(content)
    print('  Added chatHistory to OpenAI messages array.')
else:
    print('  Messages array already patched or has different format - check manually.')
"

# Rebuild and restart
echo "[4/4] Rebuilding and restarting Docker..."
cd "$BOT_DIR"
docker compose down
docker compose build --no-cache
docker compose up -d

echo ""
echo "=== Done! ==="
echo "Changes applied:"
echo "  1. Removed 'Секунду, уточняю..' thinking message"
echo "  2. Added varied error messages instead of one repetitive phrase"
echo "  3. Bot now remembers last 10 messages per user for context"
echo "  4. LLM instructed to vary its phrasing about manager consultations"
echo ""
echo "Test the bot in Telegram to verify."
