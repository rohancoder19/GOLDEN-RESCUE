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
 * Generate AI reasoning using Gemini 2.5 Flash with fallback
 * @param {string} prompt - Prompt to evaluate
 * @param {object} fallbackData - Structured heuristic fallback
 * @returns {Promise<string>}
 */
export async function generateAiContent(prompt, fallbackData = 'Automated AI Triage Assessment completed.') {
  if (model) {
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (err) {
      console.warn('[AI] ⚠️ Gemini API runtime error, utilizing clinical fallback:', err.message);
      return typeof fallbackData === 'string' ? fallbackData : JSON.stringify(fallbackData);
    }
  }
  return typeof fallbackData === 'string' ? fallbackData : JSON.stringify(fallbackData);
}

export { model, genAI };
