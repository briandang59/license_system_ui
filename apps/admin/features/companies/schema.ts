import { z } from "zod";

export const companyInputSchema = z.strictObject({
  code: z.string().trim().min(2).max(50),
  name: z.string().trim().min(2).max(255),
  tax_code: z.string().trim().max(50).nullish(),
  email: z.string().trim().max(255).nullish(),
  phone: z.string().trim().max(50).nullish(),
  status: z.enum(["active", "inactive"]).optional(),
});
export const companyUpdateSchema = companyInputSchema.extend({
  code: companyInputSchema.shape.code.nullable(),
  name: companyInputSchema.shape.name.nullable(),
  status: companyInputSchema.shape.status.nullable(),
}).partial().refine(
  (data) => Object.entries(data).some(([key, value]) => value !== undefined && (value !== null || ["tax_code", "email", "phone"].includes(key))),
  { message: "Provide at least one field to update." },
);

export const companyFormSchema = companyInputSchema.extend({
  tax_code: z.string().trim().max(50),
  email: z.string().trim().max(255),
  phone: z.string().trim().max(50),
  status: z.enum(["active", "inactive"]),
});

export const companySchema = z.object({
  id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  code: z.string().trim().min(2).max(50),
  name: z.string().trim().min(2).max(255),
  tax_code: z.string().trim().max(50).nullable(),
  email: z.string().trim().max(255).nullable(),
  phone: z.string().trim().max(50).nullable(),
  status: z.enum(["active", "inactive"]),
  created_at: z.string(),
  updated_at: z.string(),
});
export const companyListSchema = z.object({
  items: z.array(companySchema),
  limit: z.number().int().positive().max(100),
  offset: z.number().int().nonnegative(),
});
export type CompanyInput = z.infer<typeof companyInputSchema>;
export type CompanyUpdate = z.infer<typeof companyUpdateSchema>;
export type CompanyForm = z.infer<typeof companyFormSchema>;
export type CompanyList = z.infer<typeof companyListSchema>;
export type Company = z.infer<typeof companySchema>;
