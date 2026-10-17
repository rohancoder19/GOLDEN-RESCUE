import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
let genAI = null;
let model = null;

if (apiKey && apiKey.trim() !== '') {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-2.5-flash which is verified active for this key
    model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    console.log('[AI] 🧠 Gemini 2.5 Flash initialized successfully');
  } catch (err) {
    console.warn('[AI] ⚠️ Failed to initialize Gemini SDK:', err.message);
  }
} else {
  console.warn('[AI] ⚠️ GEMINI_API_KEY missing. Fallback clinical heuristic engine active.');
}

/**
 * Generate AI reasoning using Gemini 2.5 Flash with timeout protection and clinical fallback
 * @param {string} prompt - Prompt to evaluate
 * @param {object|string} fallbackData - Structured heuristic fallback
 * @param {number} timeoutMs - Max wait time in ms before fallback (default 6000ms)
 * @returns {Promise<string>}
 */
export async function generateAiContent(
  prompt,
  fallbackData = 'Automated AI Triage Assessment completed.',
  timeoutMs = 6000
) {
  const fallbackString = typeof fallbackData === 'string' ? fallbackData : JSON.stringify(fallbackData);

  if (!model) {
    return fallbackString;
  }

  try {
    // Timeout wrapper to guarantee the emergency pipeline never hangs
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Gemini API call timed out after ${timeoutMs}ms`)), timeoutMs)
    );

    const callPromise = (async () => {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    })();

    const responseText = await Promise.race([callPromise, timeoutPromise]);
    return responseText;
  } catch (err) {
    console.warn(`[AI] ⚠️ Gemini API (${err.message}). Utilizing verified clinical heuristic fallback.`);
    return fallbackString;
  }
}

export { model, genAI };
