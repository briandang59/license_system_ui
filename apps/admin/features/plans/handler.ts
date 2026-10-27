import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
z.config(z.locales.vi());
import {
  planInputSchema,
  planUpdateSchema,
  planSchema,
  planListSchema,
  planFeatureInputSchema,
  planFeatureUpdateSchema,
  planFeatureSchema,
  planFeatureListSchema,
} from "@/features/plans/schema";

function failure(status: number, code: string) {
  return NextResponse.json(
    { success: false, error: { code, message: "Không thể thực hiện yêu cầu về gói dịch vụ." } },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function handlePlan(request: Request, id?: string, resource?: "features", featureId?: string) {
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
  if (id !== undefined && (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))))
    return failure(400, "VALIDATION_ERROR");
  if (resource && !id) return failure(400, "VALIDATION_ERROR");
  if (featureId !== undefined && (!resource || !/^[1-9]\d*$/.test(featureId) || !Number.isSafeInteger(Number(featureId))))
    return failure(400, "VALIDATION_ERROR");
  if (!(featureId ? ["PATCH"] : id && !resource ? ["GET", "PATCH", "DELETE"] : ["GET", "POST"]).includes(method))
    return failure(405, "METHOD_NOT_ALLOWED");
  let body;
  if (method === "POST" || method === "PATCH") {
    const parsed = (
      featureId ? planFeatureUpdateSchema : resource ? planFeatureInputSchema : method === "POST" ? planInputSchema : planUpdateSchema
    ).safeParse(await request.json().catch(() => null));
    if (!parsed.success) return failure(400, "VALIDATION_ERROR");
    body = parsed.data;
  }
  const params = new URL(request.url).searchParams;
  const offset = params.get("offset") ?? "0";
  if (!/^\d+$/.test(offset) || Number(offset) > 2147483647 || !Number.isSafeInteger(Number(offset)))
    return failure(400, "VALIDATION_ERROR");
  const search = params.get("search")?.trim() ?? "";
  const query = new URLSearchParams({ limit: "20", offset });
  if (method === "GET" && search) query.set("search", search);
  const include = params.get("include");
  if (include !== null) {
    const paths = include.split(",").map(value => value.trim());
    if (resource || id || paths.some(value => !["features", "product"].includes(value)))
      return failure(400, "VALIDATION_ERROR");
    query.set("include", [...new Set(paths)].join(","));
  }
  const path = resource
    ? `/plans/${id}/features${featureId ? `/${featureId}` : method === "GET" ? `?${new URLSearchParams({ limit: "20", offset })}` : ""}`
    : id ? `/plans/${id}` : `/plans?${query}`;
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
      return new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
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
        data: resource
          ? method === "GET" ? planFeatureListSchema : planFeatureSchema
          : method === "GET" && !id ? planListSchema : planSchema,
      })
      .safeParse(json);
    if (!result.success) return failure(502, "INVALID_RESPONSE");
    if (featureId) {
      const item = planFeatureSchema.safeParse(result.data.data);
      if (!item.success || item.data.plan_id !== Number(id) || item.data.feature_id !== Number(featureId))
        return failure(502, "INVALID_RESPONSE");
    }
    if (method === "GET" && !id && include !== null) {
      const list = planListSchema.safeParse(result.data.data);
      const paths = include.split(",").map(value => value.trim());
      if (!list.success || list.data.items.some(plan =>
        (paths.includes("features") && plan.features === undefined) ||
        (paths.includes("product") && plan.product === undefined)))
        return failure(502, "INVALID_RESPONSE");
    }
    return NextResponse.json(result.data, {
      status: response.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return failure(502, "API_UNAVAILABLE");
  }
}
