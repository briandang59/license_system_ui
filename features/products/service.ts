import { api } from "@/lib/api";
import { productUrls } from "@/features/products/urls";
import type {
  Product,
  ProductInput,
  ProductUpdate,
  ProductList,
} from "@/features/products/schema";

export const productService = {
  getAll: (offset = 0, signal?: AbortSignal, search = "") => {
    const query = new URLSearchParams({ limit: "20", offset: String(offset) });
    if (search.trim()) query.set("search", search.trim());
    return api<ProductList>(`${productUrls.list}?${query}`, { signal });
  },
  getById: (id: number, signal?: AbortSignal) =>
    api<Product>(productUrls.detail(id), { signal }),
  create: (data: ProductInput) =>
    api<Product>(productUrls.list, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  update: (id: number, data: ProductUpdate) =>
    api<Product>(productUrls.detail(id), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  remove: (id: number) =>
    api<void>(productUrls.detail(id), { method: "DELETE" }),
};
