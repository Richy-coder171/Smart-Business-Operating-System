import { z } from "zod";

const optionalString = (max) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(max).optional()
  );

export const transactionCreateSchema = z.object({
  customerId: z.string().trim().min(1),
  type: z.enum(["credit", "payment"]),
  amount: z.coerce.number().positive(),
  description: optionalString(300),
  date: z.coerce.date().optional(),
  paymentMethod: optionalString(80),
  referenceNumber: optionalString(120)
});

export const transactionQuerySchema = z.object({
  customerId: z.string().trim().optional(),
  type: z.enum(["credit", "payment"]).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(30)
});
