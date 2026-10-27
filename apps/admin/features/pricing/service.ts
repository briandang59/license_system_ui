import { api } from "@/lib/api";
import { priceUrls } from "./urls";
import type { Price, PriceInput, PriceUpdate } from "./schema";
type Kind = "plans" | "features";
export const priceService = {
    list: (kind: Kind, parent: number, offset = 0, signal?: AbortSignal) => api<{
        items: Price[];
        limit: number;
        offset: number;
    }>(`${priceUrls.list(kind, parent)}?offset=${offset}`, { signal }),
    create: (kind: Kind, parent: number, data: PriceInput) => api<Price>(priceUrls.list(kind, parent), { method: "POST", body: JSON.stringify(data) }),
    update: (kind: Kind, parent: number, id: number, data: PriceUpdate) => api<Price>(priceUrls.detail(kind, parent, id), { method: "PATCH", body: JSON.stringify(data) }),
    remove: (kind: Kind, parent: number, id: number) => api<void>(priceUrls.detail(kind, parent, id), { method: "DELETE" }),
};
