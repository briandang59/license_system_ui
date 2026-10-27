import { api } from "@/lib/api";
import { planUrls } from "@/features/plans/urls";
import type {
  Plan,
  PlanInput,
  PlanUpdate,
  PlanList,
  PlanFeature,
  PlanFeatureInput,
  PlanFeatureList,
} from "@/features/plans/schema";

export const planService = {
  getFeatures: async (id: number, signal?: AbortSignal) => {
    const items: PlanFeature[] = [];
    let offset = 0;
    while (true) {
      const query = new URLSearchParams({ offset: String(offset) });
      const page = await api<PlanFeatureList>(`${planUrls.features(id)}?${query}`, { signal });
      items.push(...page.items);
      if (page.items.length < page.limit) return items;
      offset += page.limit;
    }
  },
  addFeatures: (id: number, items: PlanFeatureInput[]) =>
    Promise.allSettled(items.map((data) =>
      api<PlanFeature>(planUrls.features(id), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    )),
  getAll: (offset = 0, signal?: AbortSignal, search = "") => {
    const query = new URLSearchParams({ limit: "20", offset: String(offset) });
    if (search.trim()) query.set("search", search.trim());
    return api<PlanList>(`${planUrls.list}?${query}`, { signal });
  },
  getById: (id: number, signal?: AbortSignal) =>
    api<Plan>(planUrls.detail(id), { signal }),
  create: (data: PlanInput) =>
    api<Plan>(planUrls.list, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  update: (id: number, data: PlanUpdate) =>
    api<Plan>(planUrls.detail(id), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  remove: (id: number) =>
    api<void>(planUrls.detail(id), { method: "DELETE" }),
};
