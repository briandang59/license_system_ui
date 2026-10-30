import { api } from "@/lib/api";
import type { Dashboard } from "./schema";
import { dashboardUrls } from "./urls";
export const dashboardService = { get: (from: string, to: string, search: string, signal?: AbortSignal) => api<Dashboard>(`${dashboardUrls.overview}?${new URLSearchParams({ from, to, ...(search ? { search } : {}) })}`, { signal }) };
