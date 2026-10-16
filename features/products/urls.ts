export const productUrls = {
  list: "/api/products",
  detail: (id: number) => `/api/products/${id}`,
} as const;
