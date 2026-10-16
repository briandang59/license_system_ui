import { authUrls } from "@/features/auth/urls";
import { api } from "@/lib/api";
import type { LoginInput, RegisterInput, AuthUser } from "@/features/auth/schema";

export const authService = {
  register: (data: RegisterInput) =>
    api<null>(authUrls.register, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  logout: () => api<void>(authUrls.logout, { method: "POST" }),
  me: (signal?: AbortSignal) => api<AuthUser>(authUrls.me, { signal }),
  refresh: () => api<null>(authUrls.refresh, { method: "POST" }),
  login: (data: LoginInput) =>
    api<null>(authUrls.login, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }),
};
