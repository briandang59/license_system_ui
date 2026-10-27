import { z } from "zod";
z.config(z.locales.vi());
export const importResources = ["products", "companies", "units", "features", "plans", "plan-features", "plan-prices", "feature-prices"] as const;
export const exportResources = [...importResources, "subscriptions", "subscription-features", "licenses", "license-entitlements", "license-activations", "license-audit-logs"] as const;
export const exportResourceSchema = z.enum(exportResources);
export type TransferResource = z.infer<typeof exportResourceSchema>;
export const importResultSchema = z.object({ valid: z.boolean(), committed: z.boolean(), created: z.number().int().nonnegative(), updated: z.number().int().nonnegative(), fingerprint: z.string().regex(/^[a-f0-9]{64}$/), rows: z.array(z.object({ row: z.number().int().positive(), action: z.enum(["pending", "create", "update", "error"]), label: z.string(), code: z.string(), message: z.string() })).max(500) });
export type ImportResult = z.infer<typeof importResultSchema>;
export const maxFileBytes = 2 * 1024 * 1024;
