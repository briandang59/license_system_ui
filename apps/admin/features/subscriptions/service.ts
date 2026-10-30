import { api } from "@/lib/api";
import { subscriptionUrls as urls } from "./urls";
import type { Subscription, SubscriptionInput, SubscriptionUpdate, Addon, AddonInput, AddonUpdate } from "./schema";
export const subscriptionService = {
    list: (offset = 0, status = "", signal?: AbortSignal, search = "") => api<{
        items: Subscription[];
        limit: number;
        offset: number;
    }>(`${urls.list}?${new URLSearchParams({ offset: String(offset), ...(status ? { status } : {}), ...(search.trim() ? { search: search.trim() } : {}) })}`, { signal }),
    detail: (id: number, signal?: AbortSignal) => api<Subscription>(urls.detail(id), { signal }),
    create: (data: SubscriptionInput) => api<Subscription>(urls.list, { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: SubscriptionUpdate) => api<Subscription>(urls.detail(id), { method: "PATCH", body: JSON.stringify(data) }),
    addons: (id: number, offset = 0, signal?: AbortSignal) => api<{
        items: Addon[];
        limit: number;
        offset: number;
    }>(`${urls.addons(id)}?offset=${offset}`, { signal }),
    add: (id: number, data: AddonInput) => api<Addon>(urls.addons(id), { method: "POST", body: JSON.stringify(data) }),
    edit: (id: number, feature: number, data: AddonUpdate) => api<Addon>(urls.addon(id, feature), { method: "PATCH", body: JSON.stringify(data) }),
    remove: (id: number, feature: number) => api<void>(urls.addon(id, feature), { method: "DELETE" }),
};
