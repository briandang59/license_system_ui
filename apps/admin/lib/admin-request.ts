import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
type Options = {
    path: string;
    ids?: string[];
    methods: string[];
    input?: z.ZodType;
    response: z.ZodType;
    paginated?: boolean;
    queryKeys?: string[];
};
function failure(status: number, code: string) { return NextResponse.json({ success: false, error: { code, message: "Request could not be completed." } }, { status, headers: { "Cache-Control": "no-store" } }); }
// Transport shared by the new admin resources; schemas and endpoint policy remain in each feature.
export async function forwardAdminRequest(request: Request, options: Options) {
    const method = request.method;
    if (!options.methods.includes(method))
        return failure(405, "METHOD_NOT_ALLOWED");
    if (method !== "GET" && request.headers.get("origin") !== (process.env.APP_ORIGIN || new URL(request.url).origin))
        return failure(403, "FORBIDDEN");
    const token = new NextRequest(request.url, { headers: request.headers }).cookies.get("access_token")?.value;
    if (!token)
        return failure(401, "UNAUTHORIZED");
    if (options.ids?.some(id => !(/^[1-9]\d*$/.test(id) && Number.isSafeInteger(Number(id)))))
        return failure(400, "VALIDATION_ERROR");
    let body: unknown;
    if (method === "POST" || method === "PATCH") {
        const result = options.input?.safeParse(await request.json().catch(() => null));
        if (!result?.success)
            return failure(400, "VALIDATION_ERROR");
        body = result.data;
    }
    const query = new URLSearchParams();
    const params = new URL(request.url).searchParams;
    if (options.paginated && method === "GET") {
        const offset = params.get("offset") ?? "0";
        if (!/^\d+$/.test(offset) || Number(offset) > 2147483647)
            return failure(400, "VALIDATION_ERROR");
        query.set("limit", "20");
        query.set("offset", offset);
        for (const key of options.queryKeys ?? []) {
            const value = params.get(key)?.trim();
            if (value)
                query.set(key, value);
        }
    }
    try {
        const res = await fetch(`${process.env.API_BASE_URL ?? "http://localhost:5000/api/v1"}${options.path}${query.size ? `?${query}` : ""}`, { method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body), cache: "no-store", signal: AbortSignal.timeout(10000) });
        if (method === "DELETE" && res.status === 204)
            return new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
        const json: unknown = await res.json().catch(() => null);
        const envelope = z.object({ success: z.boolean(), data: z.unknown().optional(), error: z.object({ code: z.string() }).optional() }).safeParse(json);
        if (!res.ok)
            return failure(res.status, envelope.success ? envelope.data.error?.code ?? "API_ERROR" : "API_ERROR");
        if (!envelope.success || !envelope.data.success)
            return failure(502, "INVALID_RESPONSE");
        const data = options.response.safeParse(envelope.data.data);
        if (!data.success)
            return failure(502, "INVALID_RESPONSE");
        return NextResponse.json({ success: true, data: data.data }, { status: res.status, headers: { "Cache-Control": "no-store" } });
    }
    catch {
        return failure(502, "API_UNAVAILABLE");
    }
}
