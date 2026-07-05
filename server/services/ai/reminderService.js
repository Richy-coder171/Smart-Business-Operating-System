import { reminderOutputSchema } from "./schemas.js";
import { ensureAiAvailableOrDemo, generateGeminiJson, hasGeminiConfig } from "./geminiClient.js";
import { formatINR } from "../../utils/money.js";

function templateReminder(customer, language, tone) {
  const balance = formatINR(customer.totalDue);
  const prefix = tone === "firm" ? "Reminder" : "Namaste";

  if (language === "en") {
    return `Hello ${customer.name}, this is a polite reminder that ${balance} is pending for your account. Please share a payment update when convenient. Thank you.`;
  }

  if (language === "hi") {
    return `${prefix} ${customer.name} ji, aapke account me ${balance} pending hai. Kripya payment update share kar dein. Dhanyavaad.`;
  }

  return `${prefix} ${customer.name} ji, ${balance} balance pending hai. Please payment ka update bata dein. Dhanyavaad.`;
}

export async function generateReminderMessage({ customer, language, tone }) {
  ensureAiAvailableOrDemo();

  if (!hasGeminiConfig()) {
    return {
      message: templateReminder(customer, language, tone),
      generatedBy: "template"
    };
  }

  const prompt = `
Return JSON only with shape {"message":"..."}.
Create a concise WhatsApp payment reminder.
Customer name: ${customer.name}
Exact current balance: ${formatINR(customer.totalDue)}
Language: ${language}
Tone: ${tone}
Rules: respectful, no threats, no invented claims, editable by business owner.
`;

  const output = await generateGeminiJson(prompt, reminderOutputSchema);
  return {
    message: output.message,
    generatedBy: "gemini"
  };
}
