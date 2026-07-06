import { z } from "zod";

const optionalString = (max) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(max).optional()
  );

function isReadableIndianPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  const local = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits.replace(/^0+/, "");
  return local.length === 10 && /^[6-9]/.test(local);
}

export const customerCreateSchema = z.object({
  name: z.string().trim().min(2, "Name is required.").max(120),
  phone: z
    .string({ required_error: "Phone is required." })
    .trim()
    .min(1, "Phone is required.")
    .max(24)
    .refine(isReadableIndianPhone, "Enter a valid Indian 10-digit phone number."),
  address: optionalString(300),
  creditLimit: z.coerce.number().min(0).optional().default(0),
  paymentTermsDays: z.coerce.number().int().min(0).max(365).optional().default(7),
  nextFollowUpDate: z.coerce.date().optional(),
  notes: optionalString(1000),
  status: z.enum(["active", "inactive"]).optional().default("active")
});

export const customerUpdateSchema = customerCreateSchema.partial();

export const customerQuerySchema = z.object({
  search: z.string().trim().max(80).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  sortBy: z.enum(["name", "totalDue", "nextFollowUpDate", "createdAt"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  status: z.enum(["active", "inactive", "all"]).optional().default("active"),
  outstanding: z.enum(["true", "false"]).optional()
});
