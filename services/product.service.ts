import { api } from "@/lib/api";
import { urls } from "@/utils/constants/urls";
import type {
  Product,
  ProductInput,
  ProductUpdate,
  ProductList,
} from "@/lib/product-schema";

export const productService = {
  getAll: (offset = 0, signal?: AbortSignal) =>
    api<ProductList>(`${urls.products.list}?limit=20&offset=${offset}`, {
      signal,
    }),
  getById: (id: number, signal?: AbortSignal) =>
    api<Product>(urls.products.detail(id), { signal }),
  create: (data: ProductInput) =>
    api<Product>(urls.products.list, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  update: (id: number, data: ProductUpdate) =>
    api<Product>(urls.products.detail(id), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  remove: (id: number) =>
    api<void>(urls.products.detail(id), { method: "DELETE" }),
};
