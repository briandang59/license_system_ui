import { api } from "@/lib/api";
import { companyUrls } from "@/features/companies/urls";
import type {
  Company,
  CompanyInput,
  CompanyUpdate,
  CompanyList,
} from "@/features/companies/schema";

export const companyService = {
  getAll: (offset = 0, signal?: AbortSignal, search = "") => {
    const query = new URLSearchParams({ limit: "20", offset: String(offset) });
    if (search.trim()) query.set("search", search.trim());
    return api<CompanyList>(`${companyUrls.list}?${query}`, { signal });
  },
  getById: (id: number, signal?: AbortSignal) =>
    api<Company>(companyUrls.detail(id), { signal }),
  create: (data: CompanyInput) =>
    api<Company>(companyUrls.list, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  update: (id: number, data: CompanyUpdate) =>
    api<Company>(companyUrls.detail(id), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  remove: (id: number) =>
    api<void>(companyUrls.detail(id), { method: "DELETE" }),
};
