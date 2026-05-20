/**
 * Patch instructions for /opt/Younica-ai-bot/src/lib/llm.js
 *
 * Two changes are needed:
 *
 * 1. In the PROMPT array, add this line AFTER the existing prompt entries:
 *    "РАЗНООБРАЗИЕ: НЕ повторяй одни и те же формулировки про менеджера и созвон. Если в истории диалога ты уже предлагал созвон — в следующем ответе подведи к этому иначе: покажи экспертизу, задай уточняющий вопрос, расскажи мини-кейс, и только потом мягко напомни про консультацию другими словами. Будь живым и естественным собеседником.",
 *
 * 2. In the answerOpenAI function, replace the messages array to include chatHistory:
 *
 *    BEFORE:
 *      messages: [
 *        { role: "system", content: system },
 *        { role: "user", content: question },
 *      ],
 *
 *    AFTER:
 *      messages: [
 *        { role: "system", content: system },
 *        ...(chatHistory || []).map(m => ({
 *          role: m.role === "user" ? "user" : "assistant",
 *          content: m.text,
 *        })),
 *        { role: "user", content: question },
 *      ],
 *
 * 3. In the answerWithLLM function, accept chatHistory and pass it to provider:
 *
 *    BEFORE:
 *      async function answerWithLLM({ question, faqPairs }) {
 *
 *    AFTER:
 *      async function answerWithLLM({ question, faqPairs, chatHistory }) {
 *
 *    And when calling answerOpenAI, pass chatHistory:
 *      const result = await answerOpenAI({ system, question, chatHistory, model, apiKey });
 */
