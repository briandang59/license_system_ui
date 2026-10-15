import { urls } from "@/utils/constants/urls";
import { api } from "@/lib/api";
import type { LoginInput, RegisterInput, AuthUser } from "@/lib/auth-schema";

export const authService = {
  register: (data: RegisterInput) =>
    api<null>(urls.auth.register, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  logout: () => api<void>(urls.auth.logout, { method: "POST" }),
  me: (signal?: AbortSignal) =>
    api<AuthUser>(urls.auth.me, { signal }),
  refresh: () => api<null>(urls.auth.refresh, { method: "POST" }),
  login: (data: LoginInput) =>
    api<null>(urls.auth.login, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }),
};
