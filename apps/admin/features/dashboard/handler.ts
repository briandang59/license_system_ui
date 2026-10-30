import { NextResponse } from "next/server";
import { forwardAdminRequest } from "@/lib/admin-request";
import { dashboardQuerySchema, dashboardSchema } from "./schema";
export function handleDashboard(request: Request) {
 const query = Object.fromEntries(new URL(request.url).searchParams);
 if (!dashboardQuerySchema.safeParse(query).success) return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Khoảng thời gian hoặc từ khóa không hợp lệ." } }, { status: 400, headers: { "Cache-Control": "no-store" } });
 return forwardAdminRequest(request, { path: "/dashboard", methods: ["GET"], response: dashboardSchema, queryKeys: ["from", "to", "search"] });
}
