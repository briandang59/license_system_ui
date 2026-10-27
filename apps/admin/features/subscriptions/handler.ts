import { forwardAdminRequest } from "@/lib/admin-request";
import { subscriptionInputSchema, subscriptionUpdateSchema, subscriptionSchema, subscriptionListSchema, addonInputSchema, addonUpdateSchema, addonSchema, addonListSchema } from "./schema";
export function handleSubscription(request: Request, id?: string) {
    const url = new URL(request.url);
    if (request.method === "GET" && !id)
        url.searchParams.set("include", "plan,company");
    return forwardAdminRequest(new Request(url, request), { path: `/subscriptions${id ? `/${id}` : ""}`, ids: id ? [id] : [], methods: id ? ["GET", "PATCH"] : ["GET", "POST"], input: request.method === "POST" ? subscriptionInputSchema : subscriptionUpdateSchema, response: request.method === "GET" && !id ? subscriptionListSchema : subscriptionSchema, paginated: !id, queryKeys: ["status", "include"] });
}
export function handleAddon(request: Request, id: string, feature?: string) { return forwardAdminRequest(request, { path: `/subscriptions/${id}/features${feature ? `/${feature}` : ""}`, ids: [id, ...(feature ? [feature] : [])], methods: feature ? ["GET", "PATCH", "DELETE"] : ["GET", "POST"], input: request.method === "POST" ? addonInputSchema : addonUpdateSchema, response: request.method === "GET" && !feature ? addonListSchema : addonSchema, paginated: !feature }); }
