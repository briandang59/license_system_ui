import { z } from "zod";
z.config(z.locales.vi());
const id = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
export const offerSchema = z.object({ kind: z.enum(["plan", "feature"]), price_id: id, owner_id: id, product_id: id, product_name: z.string(), name: z.string(), code: z.string(), description: z.string().nullable(), feature_type: z.string().nullable(), amount_minor: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER), currency: z.string().regex(/^[A-Z]{3}$/), billing_interval: z.enum(["month", "year", "one_time"]), effective_from: z.string(), effective_to: z.string().nullable(), benefits: z.array(z.object({ name: z.string(), feature_type: z.string(), limit_value: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).nullable(), unit: z.string().nullable() })) });
export const pricingSchema = z.object({ items: z.array(offerSchema), limit: z.number().int().positive().max(100), offset: z.number().int().nonnegative() });
export type Offer = z.infer<typeof offerSchema>;
export const catalogItemSchema = offerSchema.pick({ kind: true, owner_id: true, product_id: true, product_name: true, name: true, code: true, description: true, feature_type: true, benefits: true }).extend({ unit: z.string().nullable() });
export const catalogSchema = pricingSchema.extend({ items: z.array(catalogItemSchema) });
export type CatalogItem = z.infer<typeof catalogItemSchema>;
