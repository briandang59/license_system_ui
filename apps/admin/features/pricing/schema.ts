import { z } from "zod";
const integer = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const priceInputSchema = z.strictObject({ amount_minor: integer, currency: z.string().trim().regex(/^[A-Z]{3}$/), billing_interval: z.enum(["month", "year", "one_time"]), effective_from: z.iso.datetime({ offset: true }), effective_to: z.iso.datetime({ offset: true }).nullable().optional(), status: z.enum(["active", "inactive"]).optional() }).refine(v => !v.effective_to || Date.parse(v.effective_to) > Date.parse(v.effective_from), { message: "End must follow start", path: ["effective_to"] });
export const priceUpdateSchema = z.strictObject({ effective_to: z.iso.datetime({ offset: true }).nullable().optional(), status: z.enum(["active", "inactive"]).optional() }).refine(v => Object.values(v).some(x => x !== undefined), { message: "Provide at least one change" });
export const priceSchema = z.object({ id: integer.positive(), plan_id: integer.positive().optional(), feature_id: integer.positive().optional(), amount_minor: integer, currency: z.string().regex(/^[A-Z]{3}$/), billing_interval: z.enum(["month", "year", "one_time"]), effective_from: z.string(), effective_to: z.string().nullable(), status: z.enum(["active", "inactive"]), created_at: z.string(), updated_at: z.string() });
export const priceListSchema = z.object({ items: z.array(priceSchema), limit: z.number().int().positive().max(100), offset: integer });
export type Price = z.infer<typeof priceSchema>;
export type PriceInput = z.infer<typeof priceInputSchema>;
export type PriceUpdate = z.infer<typeof priceUpdateSchema>;
