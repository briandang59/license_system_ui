export const companyUrls = {
  list: "/api/companies",
  detail: (id: number) => `/api/companies/${id}`,
} as const;
