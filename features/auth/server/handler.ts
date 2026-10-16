import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  authUserSchema,
  loginSchema,
  loginResponseSchema,
  registerSchema,
} from "@/features/auth/schema";

type Action = "login" | "register" | "logout" | "refresh" | "me";
const errorSchema = z.object({
  success: z.literal(false),
  error: z.object({ code: z.string() }),
});
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

function failure(status: number, code: string) {
  return NextResponse.json(
    {
      success: false,
      data: null,
      error: { code, message: "Authentication request failed." },
    },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function handleAuth(request: Request, action: Action) {
  if (
    action !== "me" &&
    request.headers.get("origin") !==
      (process.env.APP_ORIGIN || new URL(request.url).origin)
  ) {
    return failure(403, "FORBIDDEN");
  }
  let input;
  if (action === "login" || action === "register") {
    const parsed = (
      action === "login" ? loginSchema : registerSchema
    ).safeParse(await request.json().catch(() => null));
    if (!parsed.success) return failure(400, "VALIDATION_ERROR");
    input = parsed.data;
  }
  const cookies = new NextRequest(request.url, { headers: request.headers })
    .cookies;
  const access = cookies.get("access_token")?.value;
  const refresh = cookies.get("license_refresh")?.value;
  if (action === "me" && !access) return failure(401, "UNAUTHORIZED");
  if (action === "refresh" && !refresh) return failure(401, "SESSION_EXPIRED");

  try {
    const headers = new Headers();
    if (input) headers.set("Content-Type", "application/json");
    if (access) headers.set("Authorization", `Bearer ${access}`);
    if (refresh) headers.set("Cookie", `license_refresh=${refresh}`);
    const upstream = await fetch(
      `${process.env.API_BASE_URL ?? "http://localhost:5000/api/v1"}/auth/${action}`,
      {
        method: action === "me" ? "GET" : "POST",
        headers,
        body: input ? JSON.stringify(input) : undefined,
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (action === "logout" && upstream.status === 204) {
      const response = new NextResponse(null, {
        status: 204,
        headers: { "Cache-Control": "no-store" },
      });
      for (const name of ["access_token", "license_refresh"])
        response.cookies.set(name, "", { ...cookieOptions, maxAge: 0 });
      return response;
    }
    const body: unknown = await upstream.json().catch(() => null);
    const error = errorSchema.safeParse(body);
    if (!upstream.ok || error.success) {
      return failure(
        upstream.ok ? 400 : upstream.status,
        error.success ? error.data.error.code : "AUTH_FAILED",
      );
    }
    if (action === "me") {
      const parsed = z
        .object({ success: z.literal(true), data: authUserSchema })
        .safeParse(body);
      return parsed.success
        ? NextResponse.json(parsed.data, {
            headers: { "Cache-Control": "no-store" },
          })
        : failure(502, "INVALID_RESPONSE");
    }
    const parsed = loginResponseSchema.safeParse(body);
    if (!parsed.success) return failure(502, "INVALID_RESPONSE");
    const response = NextResponse.json(
      { success: true, data: null },
      { headers: { "Cache-Control": "no-store" } },
    );
    response.cookies.set("access_token", parsed.data.data.access_token, {
      ...cookieOptions,
      maxAge: parsed.data.data.expires_in,
    });
    // Backend sets the refresh cookie at Path=/ with a seven-day lifetime.
    for (const cookie of upstream.headers.getSetCookie()) {
      const match = /^license_refresh=([^;]*)/.exec(cookie);
      if (match)
        response.cookies.set("license_refresh", match[1], {
          ...cookieOptions,
          maxAge: 604800,
        });
    }
    return response;
  } catch {
    return failure(502, "AUTH_UNAVAILABLE");
  }
}
