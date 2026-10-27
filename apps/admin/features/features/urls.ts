export const featureUrls = {
  list: "/api/features",
  detail: (id: number) => `/api/features/${id}`,
} as const;
