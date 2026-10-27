import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
z.config(z.locales.vi());
import { exportResourceSchema, importResources, importResultSchema, maxFileBytes } from "./schema";
const filters = ["search", "status", "product_id", "plan_id", "feature_id", "company_id", "subscription_id", "license_id"];
function failure(status: number, code: string) { return NextResponse.json({ success: false, error: { code, message: "Không thể thực hiện yêu cầu nhập/xuất dữ liệu." } }, { status, headers: { "Cache-Control": "no-store" } }); }
async function limitedForm(request: Request) {
    if (!request.headers.get("content-type")?.startsWith("multipart/form-data;"))
        throw Error("Biểu mẫu không hợp lệ");
    const reader = request.body?.getReader();
    if (!reader)
        throw Error("Thiếu nội dung yêu cầu");
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done)
                break;
            size += value.byteLength;
            if (size > maxFileBytes + 65536) {
                await reader.cancel();
                throw Error("Nội dung yêu cầu vượt giới hạn");
            }
            ;
            chunks.push(value);
        }
    }
    finally {
        reader.releaseLock();
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
    }
    return new Request(request.url, { method: "POST", headers: { "Content-Type": request.headers.get("content-type")! }, body: bytes.buffer }).formData();
}
export async function handleTransfer(request: Request, resource: string, action: string) {
    const parsedResource = exportResourceSchema.safeParse(resource);
    if (!parsedResource.success)
        return failure(400, "VALIDATION_ERROR");
    const importing = action === "preview" || action === "commit";
    if (!importing && action !== "template" && action !== "export")
        return failure(404, "NOT_FOUND");
    if ((importing ? "POST" : "GET") !== request.method)
        return failure(405, "METHOD_NOT_ALLOWED");
    if (action !== "export" && !importResources.some(r => r === resource))
        return failure(400, "VALIDATION_ERROR");
    if (importing && request.headers.get("origin") !== (process.env.APP_ORIGIN || new URL(request.url).origin))
        return failure(403, "FORBIDDEN");
    const token = new NextRequest(request.url, { headers: request.headers }).cookies.get("access_token")?.value;
    if (!token)
        return failure(401, "UNAUTHORIZED");
    const query = new URLSearchParams();
    const params = new URL(request.url).searchParams;
    let body: FormData | undefined;
    if (importing) {
        try {
            body = await limitedForm(request);
            for (const key of body.keys()) {
                if (!["file", "parent_id", "fingerprint"].includes(key) || body.getAll(key).length !== 1)
                    return failure(400, "VALIDATION_ERROR");
            }
            const file = body.get("file");
            if (!(file instanceof File) || !file.size || file.size > maxFileBytes || !(/\.(csv|xlsx)$/i.test(file.name)))
                return failure(400, "VALIDATION_ERROR");
            const parent = body.get("parent_id");
            if (parent !== null && (typeof parent !== "string" || !/^[1-9]\d*$/.test(parent) || !Number.isSafeInteger(Number(parent))))
                return failure(400, "VALIDATION_ERROR");
            if (action === "commit" && !z.string().regex(/^[a-f0-9]{64}$/).safeParse(body.get("fingerprint")).success)
                return failure(400, "VALIDATION_ERROR");
        }
        catch {
            return failure(400, "VALIDATION_ERROR");
        }
    }
    else if (action === "template") {
        const format = params.get("format") ?? "csv";
        if (format !== "csv" && format !== "xlsx")
            return failure(400, "VALIDATION_ERROR");
        query.set("format", format);
    }
    else {
        for (const key of params.keys()) {
            if (!filters.includes(key))
                return failure(400, "VALIDATION_ERROR");
            const value = params.get(key)?.trim();
            if (value) {
                if (key.endsWith("_id") && (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))))
                    return failure(400, "VALIDATION_ERROR");
                query.set(key, value);
            }
        }
    }
    const endpoint = action === "export" ? `/exports/${resource}` : `/imports/${resource}/${action}`;
    try {
        const response = await fetch(`${process.env.API_BASE_URL ?? "http://localhost:5000/api/v1"}${endpoint}${query.size ? `?${query}` : ""}`, { method: request.method, headers: { Authorization: `Bearer ${token}` }, body, cache: "no-store", signal: AbortSignal.timeout(30000) });
        if (!response.ok) {
            const raw: unknown = await response.json().catch(() => null);
            const error = z.object({ error: z.object({ code: z.string() }) }).safeParse(raw);
            return failure(response.status, error.success ? error.data.error.code : "API_ERROR");
        }
        if (importing) {
            const raw: unknown = await response.json();
            const result = z.object({ success: z.literal(true), data: importResultSchema }).safeParse(raw);
            if (!result.success)
                return failure(502, "INVALID_RESPONSE");
            return NextResponse.json(result.data, { headers: { "Cache-Control": "no-store" } });
        }
        const expected = action === "template" && query.get("format") === "xlsx" ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : "text/csv";
        if (!response.headers.get("content-type")?.startsWith(expected))
            return failure(502, "INVALID_RESPONSE");
        const bytes = await response.arrayBuffer();
        return new NextResponse(bytes, { headers: { "Content-Type": response.headers.get("content-type")!, "Content-Disposition": `attachment; filename="${resource}${action === "template" ? "-template" : ""}.${expected === "text/csv" ? "csv" : "xlsx"}"`, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
    }
    catch {
        return failure(502, "API_UNAVAILABLE");
    }
}
