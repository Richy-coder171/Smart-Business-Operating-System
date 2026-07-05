import { GoogleGenAI } from "@google/genai";
import { env } from "../../config/env.js";
import { ApiError } from "../../utils/ApiError.js";

const TIMEOUT_MS = 12000;
const MAX_ATTEMPTS = 2;

export function hasGeminiConfig() {
  return Boolean(env.geminiApiKey && env.geminiModel);
}

export function ensureAiAvailableOrDemo() {
  if (!hasGeminiConfig() && !env.demoAiMode) {
    throw new ApiError(
      503,
      "AI is not configured. Set GEMINI_API_KEY and GEMINI_MODEL, or enable DEMO_AI_MODE for deterministic templates."
    );
  }
}

async function withTimeout(promise) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("Gemini request timed out.")), TIMEOUT_MS);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

function parseJson(text) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return JSON.parse(fenced ? fenced[1] : trimmed);
}

export async function generateGeminiJson(prompt, schema) {
  ensureAiAvailableOrDemo();

  if (!hasGeminiConfig()) {
    return null;
  }

  const ai = new GoogleGenAI({ apiKey: env.geminiApiKey });
  let lastError;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await withTimeout(
        ai.models.generateContent({
          model: env.geminiModel,
          contents: prompt,
          config: {
            responseMimeType: "application/json"
          }
        })
      );

      const text = response.text || "";
      const parsed = parseJson(text);
      return schema.parse(parsed);
    } catch (error) {
      lastError = error;
    }
  }

  throw new ApiError(502, `AI returned invalid output: ${lastError.message}`);
}
