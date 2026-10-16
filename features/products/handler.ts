import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  productInputSchema,
  productUpdateSchema,
  productSchema,
  productListSchema,
} from "@/features/products/schema";

function failure(status: number, code: string) {
  return NextResponse.json(
    { success: false, error: { code, message: "Product request failed." } },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function handleProduct(request: Request, id?: string) {
  const method = request.method;
  if (
    method !== "GET" &&
    request.headers.get("origin") !==
      (process.env.APP_ORIGIN || new URL(request.url).origin)
  )
    return failure(403, "FORBIDDEN");
  const token = new NextRequest(request.url, {
    headers: request.headers,
  }).cookies.get("access_token")?.value;
  if (!token) return failure(401, "UNAUTHORIZED");
  if (id !== undefined && !/^[1-9]\d*$/.test(id))
    return failure(400, "VALIDATION_ERROR");
  if (!(id ? ["GET", "PATCH", "DELETE"] : ["GET", "POST"]).includes(method))
    return failure(405, "METHOD_NOT_ALLOWED");
  let body;
  if (method === "POST" || method === "PATCH") {
    const parsed = (
      method === "POST" ? productInputSchema : productUpdateSchema
    ).safeParse(await request.json().catch(() => null));
    if (!parsed.success) return failure(400, "VALIDATION_ERROR");
    body = parsed.data;
  }
  const params = new URL(request.url).searchParams;
  const offset = params.get("offset") ?? "0";
  if (!/^\d+$/.test(offset) || !Number.isSafeInteger(Number(offset)))
    return failure(400, "VALIDATION_ERROR");
  const search = params.get("search")?.trim() ?? "";
  const query = new URLSearchParams({ limit: "20", offset });
  if (method === "GET" && search) query.set("search", search);
  const path = id ? `/products/${id}` : `/products?${query}`;
  try {
    const response = await fetch(
      `${process.env.API_BASE_URL ?? "http://localhost:5000/api/v1"}${path}`,
      {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (method === "DELETE" && response.status === 204)
      return new NextResponse(null, { status: 204 });
    const json: unknown = await response.json().catch(() => null);
    const error = z
      .object({
        success: z.literal(false),
        error: z.object({ code: z.string() }),
      })
      .safeParse(json);
    if (!response.ok || error.success)
      return failure(
        response.ok ? 400 : response.status,
        error.success ? error.data.error.code : "API_ERROR",
      );
    const result = z
      .object({
        success: z.literal(true),
        data: method === "GET" && !id ? productListSchema : productSchema,
      })
      .safeParse(json);
    if (!result.success) return failure(502, "INVALID_RESPONSE");
    return NextResponse.json(result.data, {
      status: response.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return failure(502, "API_UNAVAILABLE");
  }
}
