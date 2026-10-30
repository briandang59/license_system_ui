import { z } from "zod";
const count = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const licenseSchema = z.object({ id: count.positive(), company_name: z.string(), product_name: z.string(), status: z.string(), valid_from: z.iso.datetime({ offset: true }), valid_until: z.iso.datetime({ offset: true }).nullable(), issued_at: z.iso.datetime({ offset: true }).nullable(), created_at: z.iso.datetime({ offset: true }), max_activations: count.nullable(), active_activations: count, feature_count: count });
export const licenseListSchema = z.object({ items: z.array(licenseSchema), limit: count.positive().max(100), offset: count });
export type License = z.infer<typeof licenseSchema>;
export type LicenseList = z.infer<typeof licenseListSchema>;
