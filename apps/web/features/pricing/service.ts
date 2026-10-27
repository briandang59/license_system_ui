import { catalogSchema, pricingSchema, type CatalogItem, type Offer } from "./schema";

async function loadPages<T>(resource: "catalog" | "pricing", parse: (value: unknown) => {items: T[]; limit: number; offset: number}, signal?: AbortSignal): Promise<T[]> {
  const items: T[] = [];
  for (let offset = 0; ; ) {
    const response = await fetch(`/api/${resource}?offset=${offset}`, { signal, cache: "no-store" });
    if (!response.ok) throw new Error("Không thể tải dữ liệu công khai.");
    const json: unknown = await response.json();
    if (typeof json !== "object" || json === null || !("success" in json) || json.success !== true || !("data" in json)) throw new Error("Phản hồi không hợp lệ.");
    const page = parse(json.data);
    if (page.offset !== offset || page.items.length > page.limit) throw new Error("Phân trang không hợp lệ.");
    items.push(...page.items);
    if (page.items.length < page.limit) return items;
    offset += page.limit;
  }
}

export const publicPricingService = {
  catalog: (signal?: AbortSignal) => loadPages<CatalogItem>("catalog", value => catalogSchema.parse(value), signal),
  prices: (signal?: AbortSignal) => loadPages<Offer>("pricing", value => pricingSchema.parse(value), signal),
};
