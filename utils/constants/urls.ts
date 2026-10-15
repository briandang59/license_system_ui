export const urls = {
  products: {
    list: "/api/products",
    detail: (id: number) => `/api/products/${id}`,
  },
  auth: {
    login: "/api/auth/login",
    register: "/api/auth/register",
    logout: "/api/auth/logout",
    me: "/api/auth/me",
    refresh: "/api/auth/refresh",
  },
} as const;
