import { z } from "zod";

export const planInputSchema = z.strictObject({
  product_id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  code: z.string().trim().min(2).max(100),
  name: z.string().trim().min(2).max(255),
  description: z.string().trim().max(1000).nullish(),
  status: z.enum(["active", "inactive"]).optional(),
});
export const planUpdateSchema = planInputSchema.omit({ code: true, product_id: true }).extend({
  name: planInputSchema.shape.name.nullable(),
  status: planInputSchema.shape.status.nullable(),
}).partial().refine(
  (data) => Object.entries(data).some(([key, value]) => value !== undefined && (value !== null || ["description"].includes(key))),
  { message: "Provide at least one field to update." },
);

export const planFormSchema = planInputSchema.extend({
  description: z.string().trim().max(1000),
  status: z.enum(["active", "inactive"]),
});

export const planSchema = z.object({
  id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  product_id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  code: z.string().trim().min(2).max(100),
  name: z.string().trim().min(2).max(255),
  description: z.string().trim().max(1000).nullable(),
  status: z.enum(["active", "inactive"]),
  created_at: z.string(),
  updated_at: z.string(),
});
export const planListSchema = z.object({
  items: z.array(planSchema),
  limit: z.number().int().positive().max(100),
  offset: z.number().int().nonnegative(),
});
export type PlanInput = z.infer<typeof planInputSchema>;
export type PlanUpdate = z.infer<typeof planUpdateSchema>;
export type PlanForm = z.infer<typeof planFormSchema>;
export type PlanList = z.infer<typeof planListSchema>;
export type Plan = z.infer<typeof planSchema>;
