import { api } from "@/lib/api";
import { paymentUrls as urls } from "./urls";
import type { PaymentRequest, PaymentTransaction, PaymentResult, ManualPaymentInput, ReviewPaymentInput, ChangeInput, SubscriptionChange, Entitlement } from "./schema";
type Page<T> = { items: T[]; limit: number; offset: number };
export const paymentService = {
 entitlements: (id: number, offset = 0, signal?: AbortSignal) => api<Page<Entitlement>>(`${urls.entitlements(id)}?offset=${offset}`, { signal }),
 list: (offset = 0, status = "", subscription?: number, signal?: AbortSignal) => api<Page<PaymentRequest>>(`${urls.requests}?${new URLSearchParams({ offset: String(offset), ...(status ? { status } : {}), ...(subscription ? { subscription_id: String(subscription) } : {}) })}`, { signal }),
 detail: (id: number, signal?: AbortSignal) => api<PaymentRequest>(urls.request(id), { signal }),
 transactions: (offset = 0, request?: number, status = "", signal?: AbortSignal) => api<Page<PaymentTransaction>>(`${urls.transactions}?${new URLSearchParams({ offset: String(offset), ...(request ? { payment_request_id: String(request) } : {}), ...(status ? { status } : {}) })}`, { signal }),
 manual: (id: number, data: ManualPaymentInput) => api<PaymentResult>(urls.manual(id), { method: "POST", body: JSON.stringify(data) }),
 review: (id: number, data: ReviewPaymentInput) => api<PaymentResult>(urls.review(id), { method: "POST", body: JSON.stringify(data) }),
 changes: (id: number, offset = 0, signal?: AbortSignal) => api<Page<SubscriptionChange>>(`${urls.changes(id)}?offset=${offset}`, { signal }),
 createChange: (id: number, data: ChangeInput) => api<SubscriptionChange>(urls.changes(id), { method: "POST", body: JSON.stringify(data) }),
};
