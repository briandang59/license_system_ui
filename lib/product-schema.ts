import { z } from "zod";

export const productInputSchema = z.object({
  code: z.string().trim().min(2).max(100),
  name: z.string().trim().min(2).max(255),
  description: z.string().trim().max(1000),
  status: z.enum(["active", "inactive"]),
});
export const productUpdateSchema = productInputSchema.omit({ code: true });
export type ProductInput = z.infer<typeof productInputSchema>;
export type ProductUpdate = z.infer<typeof productUpdateSchema>;

export const productSchema = productInputSchema.extend({
  id: z.number().int().positive(),
  description: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Product = z.infer<typeof productSchema>;
export const productListSchema = z.object({
  items: z.array(productSchema),
  limit: z.number().int(),
  offset: z.number().int(),
});
export type ProductList = z.infer<typeof productListSchema>;
