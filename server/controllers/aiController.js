import Customer from "../models/Customer.js";
import CustomerReply from "../models/CustomerReply.js";
import Reminder from "../models/Reminder.js";
import { isValidObjectId } from "../config/db.js";
import { analyzeReplyMessage } from "../services/ai/replyAnalysisService.js";
import { answerBusinessQuestion } from "../services/ai/assistantService.js";
import { calculateBusinessInsights } from "../services/ai/insightsService.js";
import { generateReminderMessage } from "../services/ai/reminderService.js";
import { assistantRequestSchema, reminderRequestSchema, replyRequestSchema } from "../validators/aiValidators.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { env } from "../config/env.js";
import { hasGeminiConfig } from "../services/ai/geminiClient.js";

function ensureObjectId(id, label = "id") {
  if (!isValidObjectId(id)) {
    throw new ApiError(400, `Invalid ${label}.`);
  }
}

async function loadOwnerCustomer(ownerId, customerId) {
  ensureObjectId(customerId, "customer id");
  const customer = await Customer.findOne({ _id: customerId, ownerId });

  if (!customer) {
    throw new ApiError(404, "Customer not found.");
  }

  return customer;
}

export const generateReminder = asyncHandler(async (req, res) => {
  const payload = reminderRequestSchema.parse(req.body);
  const customer = await loadOwnerCustomer(req.ownerId, payload.customerId);
  const output = await generateReminderMessage({
    customer,
    language: payload.language,
    tone: payload.tone
  });

  const reminder = await Reminder.create({
    ownerId: req.ownerId,
    customerId: customer._id,
    message: output.message,
    language: payload.language,
    tone: payload.tone,
    generatedBy: output.generatedBy
  });

  res.status(201).json({
    success: true,
    reminder,
    message: output.message,
    generatedBy: output.generatedBy
  });
});

export const markReminderSent = asyncHandler(async (req, res) => {
  ensureObjectId(req.params.id, "reminder id");
  const reminder = await Reminder.findOne({ _id: req.params.id, ownerId: req.ownerId });

  if (!reminder) {
    throw new ApiError(404, "Reminder not found.");
  }

  reminder.status = "sent";
  await reminder.save();
  res.json({ success: true, reminder });
});

export const analyzeReply = asyncHandler(async (req, res) => {
  const payload = replyRequestSchema.parse(req.body);
  const customer = await loadOwnerCustomer(req.ownerId, payload.customerId);
  const referenceDate = payload.referenceDate || new Date();
  const analysis = await analyzeReplyMessage({
    customer,
    message: payload.message,
    referenceDate
  });

  const reply = await CustomerReply.create({
    ownerId: req.ownerId,
    customerId: customer._id,
    originalMessage: payload.message,
    intent: analysis.intent,
    promisedPaymentDate: analysis.promisedPaymentDate ? new Date(`${analysis.promisedPaymentDate}T00:00:00.000Z`) : undefined,
    extractedAmount: analysis.extractedAmount,
    confidence: analysis.confidence,
    language: analysis.language,
    summary: analysis.summary,
    suggestedAction: analysis.suggestedAction,
    rawAIResponse: analysis
  });

  customer.lastReplyIntent = analysis.intent;
  let nextFollowUpUpdated = false;
  if (analysis.intent === "promise_to_pay" && analysis.promisedPaymentDate && analysis.confidence >= 0.6) {
    customer.nextFollowUpDate = new Date(`${analysis.promisedPaymentDate}T00:00:00.000Z`);
    nextFollowUpUpdated = true;
  }
  await customer.save();

  res.status(201).json({
    success: true,
    analysis: {
      ...analysis,
      requiresManualReview: analysis.confidence < 0.6
    },
    nextFollowUpUpdated,
    reply
  });
});

export const businessInsights = asyncHandler(async (req, res) => {
  const insights = await calculateBusinessInsights(req.ownerId);
  res.json({
    success: true,
    insights,
    generatedBy: "template",
    demoAiMode: env.demoAiMode,
    gemini: hasGeminiConfig() ? "configured" : "not configured"
  });
});

export const assistant = asyncHandler(async (req, res) => {
  const payload = assistantRequestSchema.parse(req.body);
  const result = await answerBusinessQuestion(req.ownerId, payload.question);
  res.json({
    success: true,
    ...result
  });
});
