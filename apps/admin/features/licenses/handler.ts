import { forwardAdminRequest } from "@/lib/admin-request";
import { licenseListSchema } from "./schema";
export function handleLicenses(request: Request) { return forwardAdminRequest(request, { path: "/licenses", methods: ["GET"], response: licenseListSchema, paginated: true, queryKeys: ["search", "status"] }); }
