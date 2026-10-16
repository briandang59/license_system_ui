export const planUrls = {
  list: "/api/plans",
  detail: (id: number) => `/api/plans/${id}`,
  features: (id: number) => `/api/plans/${id}/features`,
} as const;
