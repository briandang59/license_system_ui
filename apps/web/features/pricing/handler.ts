import { catalogSchema, pricingSchema } from "./schema";
export async function handlePricing(request: Request, resource: "pricing" | "catalog" = "pricing") {
    const params = new URL(request.url).searchParams;
    const query = new URLSearchParams({ limit: "100" });
    const offset = params.get("offset") ?? "0";
    if (!/^\d+$/.test(offset) || Number(offset) > 2147483647)
        return Response.json({ success: false, error: { code: "VALIDATION_ERROR" } }, { status: 400 });
    query.set("offset", offset);
    for (const key of resource === "catalog" ? ["product_id"] : ["currency", "billing_interval", "product_id"]) {
        const value = params.get(key);
        if (value)
            query.set(key, value);
    }
    try {
        const res = await fetch(`${process.env.API_BASE_URL ?? "http://localhost:5000/api/v1"}/public/${resource}?${query}`, { cache: "no-store", signal: AbortSignal.timeout(10000) });
        if (!res.ok)
            return Response.json({ success: false, error: { code: "PRICING_UNAVAILABLE" } }, { status: res.status === 400 ? 400 : 502, headers: { "Cache-Control": "no-store" } });
        const raw: unknown = await res.json();
        if (typeof raw !== "object" || raw === null || !("success" in raw) || raw.success !== true || !("data" in raw))
            throw new Error("Phản hồi không hợp lệ");
        const data = (resource === "catalog" ? catalogSchema : pricingSchema).parse(raw.data);
        return Response.json({ success: true, data }, { headers: { "Cache-Control": "no-store" } });
    }
    catch {
        return Response.json({ success: false, error: { code: "PRICING_UNAVAILABLE" } }, { status: 502, headers: { "Cache-Control": "no-store" } });
    }
}
