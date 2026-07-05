import { z } from "zod";

export const replyIntentEnum = z.enum([
  "promise_to_pay",
  "payment_completed",
  "request_extension",
  "dispute_amount",
  "unable_to_pay",
  "ask_for_details",
  "acknowledgement",
  "unknown"
]);

export const replyAnalysisSchema = z.object({
  intent: replyIntentEnum,
  promisedPaymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  extractedAmount: z.number().positive().nullable(),
  language: z.string().min(2).max(30),
  confidence: z.number().min(0).max(1),
  summary: z.string().min(1).max(500),
  suggestedAction: z.string().min(1).max(500)
});

export const reminderOutputSchema = z.object({
  message: z.string().min(1).max(1000)
});

export const businessInsightSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(500),
  priority: z.enum(["low", "medium", "high"]),
  suggestedAction: z.string().min(1).max(500),
  relatedCustomerId: z.string().nullable(),
  supportingMetric: z.object({
    name: z.string().min(1),
    value: z.number()
  })
});

export const businessInsightsSchema = z.array(businessInsightSchema).max(10);
