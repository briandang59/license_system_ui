import { api } from "@/lib/api";
import { unitUrls } from "@/features/units/urls";
import type { Unit, UnitInput, UnitUpdate, UnitList, } from "@/features/units/schema";
export const unitService = {
    getAll: (offset = 0, signal?: AbortSignal, search = "") => {
        const query = new URLSearchParams({ limit: "20", offset: String(offset) });
        if (search.trim())
            query.set("search", search.trim());
        return api<UnitList>(`${unitUrls.list}?${query}`, { signal });
    },
    getById: (id: number, signal?: AbortSignal) => api<Unit>(unitUrls.detail(id), { signal }),
    create: (data: UnitInput) => api<Unit>(unitUrls.list, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    }),
    update: (id: number, data: UnitUpdate) => api<Unit>(unitUrls.detail(id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    }),
    remove: (id: number) => api<void>(unitUrls.detail(id), { method: "DELETE" }),
};
