import { api } from "@/lib/api";
import { productUrls } from "@/features/products/urls";
import type {
  Product,
  ProductInput,
  ProductUpdate,
  ProductList,
} from "@/features/products/schema";

export const productService = {
  getAll: (offset = 0, signal?: AbortSignal) =>
    api<ProductList>(`${productUrls.list}?limit=20&offset=${offset}`, {
      signal,
    }),
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
