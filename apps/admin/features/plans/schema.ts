import { z } from "zod";
z.config(z.locales.vi());

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
  { message: "Cung cấp ít nhất một trường cần cập nhật." },
);

export const planFormSchema = planInputSchema.extend({
  description: z.string().trim().max(1000),
  status: z.enum(["active", "inactive"]),
});

export const includedPlanFeatureSchema = z.object({
  feature_id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  code: z.string(),
  name: z.string(),
  feature_type: z.enum(["boolean", "quantity", "unlimited"]),
  unit: z.string().nullable(),
  unit_id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER).nullable(),
  enabled: z.boolean(),
  limit_value: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).nullable(),
});

export const planSchema = z.object({
  features: z.array(includedPlanFeatureSchema).optional(),
  product: z.object({ id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER), code: z.string(), name: z.string() }).optional(),
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

export const planFeatureInputSchema = z.strictObject({
  feature_id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  enabled: z.boolean().optional(),
  limit_value: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).nullable().optional(),
});
export const planFeatureUpdateSchema = planFeatureInputSchema.omit({ feature_id: true })
  .refine(data => data.enabled !== undefined || data.limit_value !== undefined, { message: "Cung cấp ít nhất một thay đổi." });
export const planFeatureEditSchema = planFeatureInputSchema.omit({ feature_id: true }).required();
export type PlanFeatureUpdate = z.infer<typeof planFeatureUpdateSchema>;
export type PlanFeatureEdit = z.infer<typeof planFeatureEditSchema>;
export const planFeatureSchema = planFeatureInputSchema.extend({
  enabled: z.boolean(),
  limit_value: planFeatureInputSchema.shape.limit_value.unwrap(),
  id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  plan_id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  created_at: z.string(),
  updated_at: z.string(),
});
export const planFeatureListSchema = z.object({
  items: z.array(planFeatureSchema),
  limit: z.number().int().positive().max(100),
  offset: z.number().int().nonnegative(),
});
export const planFeaturesFormSchema = z.object({
  values: z.array(planFeatureInputSchema.required()),
});
export type PlanFeatureInput = z.infer<typeof planFeatureInputSchema>;
export type PlanFeature = z.infer<typeof planFeatureSchema>;
export type PlanFeatureList = z.infer<typeof planFeatureListSchema>;
export type PlanFeaturesForm = z.infer<typeof planFeaturesFormSchema>;
