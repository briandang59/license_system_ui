import { z } from "zod";
z.config(z.locales.vi());

export const loginSchema = z.object({
  email: z.string().trim().email("Nhập địa chỉ email hợp lệ."),
  password: z.string().min(1, "Vui lòng nhập mật khẩu."),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = loginSchema.extend({
  email: z.string().trim().email().max(255),
  password: z.string().min(12).max(256),
  invite_token: z.string().min(1),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const authUserSchema = z.object({ id: z.number().int(), email: z.string().email() });
export type AuthUser = z.infer<typeof authUserSchema>;

export const loginResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    access_token: z.string().min(1),
    expires_in: z.number().int().positive(),
    token_type: z.literal("Bearer"),
  }),
});
