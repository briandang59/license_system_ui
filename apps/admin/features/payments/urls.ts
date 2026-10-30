export const paymentUrls = {
 requests: "/api/payment-requests",
 request: (id: number) => `/api/payment-requests/${id}`,
 manual: (id: number) => `/api/payment-requests/${id}/transactions`,
 transactions: "/api/payment-transactions",
 review: (id: number) => `/api/payment-transactions/${id}/review`,
 changes: (id: number) => `/api/subscriptions/${id}/changes`,
 entitlements: (id: number) => `/api/subscriptions/${id}/entitlements`,
};
