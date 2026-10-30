import { api } from "@/lib/api";
import { licenseUrls } from "./urls";
import type { LicenseList } from "./schema";
export const licenseService = { list: (offset: number, search: string, status: string, signal?: AbortSignal) => api<LicenseList>(`${licenseUrls.list}?${new URLSearchParams({ offset: String(offset), ...(search ? { search } : {}), ...(status ? { status } : {}) })}`, { signal }) };
