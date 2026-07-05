import { z } from "zod";

export const reminderRequestSchema = z.object({
  customerId: z.string().trim().min(1),
  language: z.enum(["en", "hi", "hinglish"]).default("hinglish"),
  tone: z.enum(["polite", "friendly", "professional", "firm"]).default("polite")
});

export const replyRequestSchema = z.object({
  customerId: z.string().trim().min(1),
  message: z.string().trim().min(1).max(1000),
  referenceDate: z.coerce.date().optional()
});

export const assistantRequestSchema = z.object({
  question: z.string().trim().min(2).max(500)
});
