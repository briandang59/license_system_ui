import { z } from "zod";
z.config(z.locales.vi());

export const featureInputSchema = z.strictObject({
  product_id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  code: z.string().trim().min(2).max(100),
  name: z.string().trim().min(2).max(255),
  description: z.string().trim().max(1000).nullish(),
  feature_type: z.enum(["boolean", "quantity", "unlimited"]).optional(),
  unit: z.string().trim().max(50).nullish(),
  unit_id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER).nullish(),
  status: z.enum(["active", "inactive"]).optional(),
});
export const featureUpdateSchema = featureInputSchema.extend({
  code: featureInputSchema.shape.code.nullable(),
  name: featureInputSchema.shape.name.nullable(),
  status: featureInputSchema.shape.status.nullable(),
  product_id: featureInputSchema.shape.product_id.nullable(),
  feature_type: featureInputSchema.shape.feature_type.nullable(),
}).partial().refine(
  (data) => Object.entries(data).some(([key, value]) => value !== undefined && (value !== null || ["description", "unit", "unit_id"].includes(key))),
  { message: "Cung cấp ít nhất một trường cần cập nhật." },
);

export const featureFormSchema = featureInputSchema.extend({
  description: z.string().trim().max(1000),
  feature_type: z.enum(["boolean", "quantity", "unlimited"]),
  unit: z.string().trim().max(50),
  unit_id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER).optional(),
  status: z.enum(["active", "inactive"]),
});

export const featureSchema = z.object({
  id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  product_id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  code: z.string().trim().min(2).max(100),
  name: z.string().trim().min(2).max(255),
  description: z.string().trim().max(1000).nullable(),
  feature_type: z.enum(["boolean", "quantity", "unlimited"]),
  unit: z.string().trim().max(50).nullable(),
  unit_id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER).nullable().optional(),
  status: z.enum(["active", "inactive"]),
  created_at: z.string(),
  updated_at: z.string(),
});
export const featureListSchema = z.object({
  items: z.array(featureSchema),
  limit: z.number().int().positive().max(100),
  offset: z.number().int().nonnegative(),
});
export type FeatureInput = z.infer<typeof featureInputSchema>;
export type FeatureUpdate = z.infer<typeof featureUpdateSchema>;
export type FeatureForm = z.infer<typeof featureFormSchema>;
export type FeatureList = z.infer<typeof featureListSchema>;
export type Feature = z.infer<typeof featureSchema>;
