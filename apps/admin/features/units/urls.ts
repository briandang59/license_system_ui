export const unitUrls = {
    list: "/api/units",
    detail: (id: number) => `/api/units/${id}`,
} as const;
