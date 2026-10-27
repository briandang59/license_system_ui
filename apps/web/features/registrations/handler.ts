import { z } from "zod";
import { quoteSchema, receiptSchema, registrationInputSchema, tokenSchema } from "./schema";
const headers = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" };
function failure(status: number, code: string) {
  return Response.json({ success: false, error: { code, message: "Không thể hoàn tất yêu cầu. Vui lòng thử lại hoặc liên hệ hỗ trợ." } }, { status, headers });
}
export async function handlePublicRegistration(request: Request, action: "create" | "view" | "accept") {
  if (request.method !== "POST") return failure(405, "METHOD_NOT_ALLOWED");
  if (request.headers.get("origin") !== (process.env.APP_ORIGIN || new URL(request.url).origin)) return failure(403, "FORBIDDEN");
  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > 65536) return failure(400, "VALIDATION_ERROR");
  let body: unknown;
  try { body = JSON.parse(raw); } catch { return failure(400, "VALIDATION_ERROR"); }
  const parsed = (action === "create" ? registrationInputSchema : tokenSchema).safeParse(body);
  if (!parsed.success) return failure(400, "VALIDATION_ERROR");
  try {
    const path = action === "create" ? "/public/registrations" : `/public/quotes/${action}`;
    const res = await fetch(`${process.env.API_BASE_URL ?? "http://localhost:5000/api/v1"}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data), cache: "no-store", signal: AbortSignal.timeout(10000) });
    const envelope = z.object({ success: z.boolean(), data: z.unknown().optional(), error: z.object({ code: z.string() }).optional() }).safeParse(await res.json());
    if (!res.ok) return failure([400, 404, 409, 429].includes(res.status) ? res.status : 502, envelope.success ? envelope.data.error?.code ?? "API_ERROR" : "API_ERROR");
    if (!envelope.success || !envelope.data.success) return failure(502, "INVALID_RESPONSE");
    const result = (action === "create" ? receiptSchema : quoteSchema).safeParse(envelope.data.data);
    if (!result.success) return failure(502, "INVALID_RESPONSE");
    return Response.json({ success: true, data: result.data }, { status: res.status, headers });
  } catch { return failure(502, "API_UNAVAILABLE"); }
}
