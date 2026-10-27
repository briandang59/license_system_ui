import { priceInputSchema, priceUpdateSchema, priceSchema, priceListSchema } from "./schema";
import { forwardAdminRequest } from "@/lib/admin-request";
export function handlePricing(request: Request, kind: "plans" | "features", parent: string, id?: string) {
    return forwardAdminRequest(request, { path: `/${kind}/${parent}/prices${id ? `/${id}` : ""}`, ids: [parent, ...(id ? [id] : [])], methods: id ? ["GET", "PATCH", "DELETE"] : ["GET", "POST"], input: request.method === "POST" ? priceInputSchema : priceUpdateSchema, response: request.method === "GET" && !id ? priceListSchema : priceSchema, paginated: !id });
}
