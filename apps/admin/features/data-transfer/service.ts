import { api, ApiError } from "@/lib/api";
import { importResultSchema, type TransferResource } from "./schema";
import { transferUrl } from "./urls";
export async function importFile(resource: TransferResource, file: File, parentId?: number, fingerprint?: string) { const form = new FormData(); form.set("file", file); if (parentId)
    form.set("parent_id", String(parentId)); if (fingerprint)
    form.set("fingerprint", fingerprint); return importResultSchema.parse(await api<unknown>(transferUrl(resource, fingerprint ? "commit" : "preview"), { method: "POST", body: form })); }
export async function downloadFile(resource: TransferResource, action: "template" | "export", query: Record<string, string> = {}) {
    const response = await fetch(`${transferUrl(resource, action)}?${new URLSearchParams(query)}`, { cache: "no-store" });
    if (!response.ok) {
        const json = await response.json().catch(() => null);
        throw new ApiError(response.status, undefined, json?.error?.code);
    }
    const format = action === "template" ? query.format ?? "csv" : "csv";
    const blob = await response.blob();
    saveBlob(blob, `${resource}${action === "template" ? "-template" : ""}.${format}`);
}
export function saveBlob(blob: Blob, name: string) { const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = name; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
