import { z } from "zod";

const email = z.string().email().trim().toLowerCase();

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  businessName: z.string().trim().min(2).max(140),
  email,
  phone: z.string().trim().max(24).optional().default(""),
  password: z.string().min(8).max(128),
  preferredLanguage: z.enum(["en", "hi"]).optional().default("en")
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1)
});
