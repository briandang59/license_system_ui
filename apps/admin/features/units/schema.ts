import { z } from "zod";
z.config(z.locales.vi());
export const unitInputSchema = z.strictObject({
    code: z.string().trim().min(2).max(50),
    name: z.string().trim().min(2).max(100),
    symbol: z.string().trim().max(20).nullish(),
    status: z.enum(["active", "inactive"]).optional(),
});
export const unitUpdateSchema = unitInputSchema.partial().refine(data => Object.values(data).some(v => v !== undefined), { message: "Cung cấp ít nhất một trường cần cập nhật." });
export const unitFormSchema = unitInputSchema.extend({
    symbol: z.string().trim().max(20),
    status: z.enum(["active", "inactive"]),
});
export const unitSchema = z.object({
    symbol: z.string().nullable(),
    id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    code: z.string().trim().min(2).max(50),
    name: z.string().trim().min(2).max(100),
    status: z.enum(["active", "inactive"]),
    created_at: z.string(),
    updated_at: z.string(),
});
export const unitListSchema = z.object({
    items: z.array(unitSchema),
    limit: z.number().int().positive().max(100),
    offset: z.number().int().nonnegative(),
});
export type UnitInput = z.infer<typeof unitInputSchema>;
export type UnitUpdate = z.infer<typeof unitUpdateSchema>;
export type UnitForm = z.infer<typeof unitFormSchema>;
export type UnitList = z.infer<typeof unitListSchema>;
export type Unit = z.infer<typeof unitSchema>;
