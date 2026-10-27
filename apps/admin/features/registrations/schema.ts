import { z } from "zod";
const id = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const amount = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const featureInputSchema = z.object({ feature_id: id, quantity: z.number().int().min(1).max(1000000), limit_value: amount.nullable() }).strict();
export const registrationInputSchema = z.object({
  request_key: z.uuid(), company_name: z.string().trim().min(2).max(255), contact_name: z.string().trim().min(2).max(255),
  email: z.email().max(255), phone: z.string().trim().min(1).max(50), tax_code: z.string().trim().max(50),
  address: z.string().trim().max(1000), note: z.string().trim().max(2000), product_id: id,
  plan_id: id.nullable(), plan_price_id: id.nullable(), features: z.array(featureInputSchema).max(100),
}).strict().refine(v => v.plan_price_id === null || v.plan_id !== null, { path: ["plan_price_id"], message: "Cần chọn gói cho mức giá này." });
export const receiptSchema = z.object({ reference: z.string(), status: z.enum(["pending", "quoted", "accepted"]) });
export const tokenSchema = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/) }).strict();
export const quoteLineSchema = z.object({ description: z.string().trim().min(1).max(1000), quantity: z.number().int().min(1).max(1000000), unit_amount_minor: amount }).strict();
export const quoteSchema = z.object({ id, registration_id: id, version: z.number().int().positive(), lines: z.array(quoteLineSchema).min(1).max(100), total_minor: amount, currency: z.string().regex(/^[A-Z]{3}$/), billing_interval: z.enum(["month", "year", "one_time"]), terms: z.string(), expires_at: z.iso.datetime({ offset: true }), accepted_at: z.iso.datetime({ offset: true }).nullable(), created_at: z.iso.datetime({ offset: true }) });
export type RegistrationInput = z.infer<typeof registrationInputSchema>;
export type Quote = z.infer<typeof quoteSchema>;

export const quoteInputSchema = z.object({ request_key: z.uuid(), lines: z.array(quoteLineSchema).min(1).max(100), currency: z.string().regex(/^[A-Z]{3}$/), billing_interval: z.enum(["month", "year", "one_time"]), terms: z.string().trim().min(1).max(2000), expires_at: z.iso.datetime({ offset: true }) }).strict().refine(v => Number.isSafeInteger(v.lines.reduce((sum, l) => sum + l.quantity * l.unit_amount_minor, 0)), { path: ["lines"], message: "Tổng tiền vượt giới hạn cho phép." });
export const registrationSchema = z.object({ id, reference: z.string(), company_name: z.string(), contact_name: z.string(), email: z.string(), phone: z.string(), tax_code: z.string(), address: z.string(), note: z.string(), status: z.enum(["pending", "quoted", "accepted"]), created_at: z.string(), email_sent: z.number().int(), email_pending: z.number().int(), email_failed: z.number().int(), quotes: z.array(quoteSchema), configuration: z.object({ product_id: id, product_name: z.string(), plan_id: id.nullable(), plan_price_id: id.nullable(), plan_name: z.string(), amount_minor: amount.nullable(), currency: z.string(), billing_interval: z.string(), features: z.array(featureInputSchema.extend({ name: z.string(), feature_type: z.string() })) }) });
export const registrationListSchema = z.object({ items: z.array(registrationSchema), limit: z.number().int(), offset: z.number().int() });
export type Registration = z.infer<typeof registrationSchema>;
export type QuoteInput = z.infer<typeof quoteInputSchema>;
