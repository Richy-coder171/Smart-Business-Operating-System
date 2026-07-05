import { replyAnalysisSchema } from "./schemas.js";
import { ensureAiAvailableOrDemo, generateGeminiJson, hasGeminiConfig } from "./geminiClient.js";
import { resolveRelativeDate } from "./dateResolver.js";

function extractAmount(message) {
  const match = message.match(/(?:rs\.?|inr)?\s*([0-9][0-9,]*(?:\.\d{1,2})?)/i);
  if (!match) return null;
  return Number(match[1].replace(/,/g, ""));
}

function detectLanguage(message) {
  return /kal|parso|agle|kar|dunga|diya|chahiye|galat|theek|bhejo/i.test(message)
    ? "hi"
    : "en";
}

function deterministicReplyAnalysis(message, referenceDate) {
  const normalized = message.toLowerCase();
  const promisedPaymentDate = resolveRelativeDate(message, referenceDate);
  const amount = extractAmount(message);
  const language = detectLanguage(message);

  if (/(kal|parso|agle|next|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday).*(pay|payment|dunga|karunga|de dunga)|((pay|payment|dunga|karunga|de dunga).*(kal|parso|agle|next|tomorrow))/i.test(normalized)) {
    return {
      intent: "promise_to_pay",
      promisedPaymentDate,
      extractedAmount: amount,
      language,
      confidence: promisedPaymentDate ? 0.97 : 0.78,
      summary: promisedPaymentDate
        ? `Customer promised to pay on ${promisedPaymentDate}.`
        : "Customer promised to pay, but no clear date was found.",
      suggestedAction: promisedPaymentDate
        ? "Follow up on the promised date."
        : "Ask for a specific payment date."
    };
  }

  if (/(payment|paise|amount).*(kar diya|paid|done|ho gaya)|((kar diya|paid|done).*(payment|paise|amount))/i.test(normalized)) {
    return {
      intent: "payment_completed",
      promisedPaymentDate: null,
      extractedAmount: amount,
      language,
      confidence: 0.92,
      summary: "Customer says payment has been completed.",
      suggestedAction: "Verify receipt before recording a payment transaction."
    };
  }

  if (/(time chahiye|aur time|extension|later|more time)/i.test(normalized)) {
    return {
      intent: "request_extension",
      promisedPaymentDate,
      extractedAmount: amount,
      language,
      confidence: 0.9,
      summary: "Customer requested more time.",
      suggestedAction: "Agree on a clear next follow-up date."
    };
  }

  if (/(galat|wrong|incorrect|dispute|jyada|zyada)/i.test(normalized)) {
    return {
      intent: "dispute_amount",
      promisedPaymentDate: null,
      extractedAmount: amount,
      language,
      confidence: 0.9,
      summary: "Customer disputes the amount.",
      suggestedAction: "Share ledger details and verify the balance."
    };
  }

  if (/(nahi kar sakta|cannot pay|unable|abhi nahi|not possible)/i.test(normalized)) {
    return {
      intent: "unable_to_pay",
      promisedPaymentDate: null,
      extractedAmount: amount,
      language,
      confidence: 0.9,
      summary: "Customer says they cannot pay now.",
      suggestedAction: "Discuss a realistic payment plan."
    };
  }

  if (/(details|detail|bhejo|send.*bill|statement|hisab|hisaab)/i.test(normalized)) {
    return {
      intent: "ask_for_details",
      promisedPaymentDate: null,
      extractedAmount: amount,
      language,
      confidence: 0.88,
      summary: "Customer asked for details.",
      suggestedAction: "Send the customer ledger summary."
    };
  }

  if (/(theek hai|ok|okay|fine|noted|haan|yes)/i.test(normalized)) {
    return {
      intent: "acknowledgement",
      promisedPaymentDate: null,
      extractedAmount: amount,
      language,
      confidence: 0.82,
      summary: "Customer acknowledged the reminder.",
      suggestedAction: "Keep the existing follow-up schedule."
    };
  }

  return {
    intent: "unknown",
    promisedPaymentDate: null,
    extractedAmount: amount,
    language,
    confidence: 0.35,
    summary: "Message does not clearly match a payment intent.",
    suggestedAction: "Manual review recommended."
  };
}

export async function analyzeReplyMessage({ customer, message, referenceDate }) {
  ensureAiAvailableOrDemo();

  if (!hasGeminiConfig()) {
    return replyAnalysisSchema.parse(deterministicReplyAnalysis(message, referenceDate));
  }

  const prompt = `
Return JSON only with fields:
intent, promisedPaymentDate as YYYY-MM-DD or null, extractedAmount or null, language, confidence, summary, suggestedAction.
Supported intents: promise_to_pay, payment_completed, request_extension, dispute_amount, unable_to_pay, ask_for_details, acknowledgement, unknown.
Reference date: ${referenceDate.toISOString().slice(0, 10)}
Customer: ${customer.name}
Message: ${message}
Rules: resolve Hindi and English relative dates. Do not create or imply payment transactions.
`;

  return generateGeminiJson(prompt, replyAnalysisSchema);
}
