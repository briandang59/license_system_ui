export const planUrls = {
  list: "/api/plans",
  detail: (id: number) => `/api/plans/${id}`,
  features: (id: number) => `/api/plans/${id}/features`,
  feature: (id: number, featureId: number) => `/api/plans/${id}/features/${featureId}`,
} as const;
