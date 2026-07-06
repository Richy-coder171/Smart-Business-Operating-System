import { z } from "zod";

export const reminderRequestSchema = z.object({
  customerId: z.string().trim().min(1, "Customer must be selected."),
  language: z.enum(["en", "hi", "hinglish"], { errorMap: () => ({ message: "Language must be English, Hindi, or Hinglish." }) }).default("hinglish"),
  tone: z.enum(["polite", "friendly", "professional", "firm"], { errorMap: () => ({ message: "Tone must be polite, friendly, professional, or firm." }) }).default("polite")
});

export const replyRequestSchema = z.object({
  customerId: z.string().trim().min(1, "Customer must be selected."),
  message: z.string().trim().min(1, "Reply message cannot be empty.").max(1000),
  referenceDate: z.coerce.date().optional()
});

export const assistantRequestSchema = z.object({
  question: z.string().trim().min(2).max(500)
});
