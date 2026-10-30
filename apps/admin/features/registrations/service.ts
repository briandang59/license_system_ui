import { api } from "@/lib/api";
import { registrationListSchema, registrationSchema, quoteInputSchema, quoteSchema, type QuoteInput } from "./schema";
import { registrationUrls as urls } from "./urls";
export const registrationService = {
 list: async (offset: number, signal?: AbortSignal, search = "") => registrationListSchema.parse(await api<unknown>(`${urls.list}?${new URLSearchParams({ offset: String(offset), ...(search.trim() ? { search: search.trim() } : {}) })}`, { signal })),
 detail: async (id: number, signal?: AbortSignal) => registrationSchema.parse(await api<unknown>(urls.detail(id), { signal })),
 issue: async (id: number, input: QuoteInput) => quoteSchema.parse(await api<unknown>(urls.quotes(id), { method: "POST", body: JSON.stringify(quoteInputSchema.parse(input)) })),
};
