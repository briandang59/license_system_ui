import { api } from "@/lib/api";
import { featureUrls } from "@/features/features/urls";
import type {
  Feature,
  FeatureInput,
  FeatureUpdate,
  FeatureList,
} from "@/features/features/schema";

export const featureService = {
  getAll: (offset = 0, signal?: AbortSignal, search = "") => {
    const query = new URLSearchParams({ limit: "20", offset: String(offset) });
    if (search.trim()) query.set("search", search.trim());
    return api<FeatureList>(`${featureUrls.list}?${query}`, { signal });
  },
  getById: (id: number, signal?: AbortSignal) =>
    api<Feature>(featureUrls.detail(id), { signal }),
  create: (data: FeatureInput) =>
    api<Feature>(featureUrls.list, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  update: (id: number, data: FeatureUpdate) =>
    api<Feature>(featureUrls.detail(id), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  remove: (id: number) =>
    api<void>(featureUrls.detail(id), { method: "DELETE" }),
};
