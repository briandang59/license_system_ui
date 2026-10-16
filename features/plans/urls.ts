export const planUrls = {
  list: "/api/plans",
  detail: (id: number) => `/api/plans/${id}`,
} as const;
