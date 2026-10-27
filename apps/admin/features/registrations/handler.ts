import { forwardAdminRequest } from "@/lib/admin-request";
import { registrationSchema, registrationListSchema, quoteInputSchema, quoteSchema } from "./schema";
export function handleRegistration(request: Request, id?: string, quotes = false) {
 return forwardAdminRequest(request, { path: `/registrations${id ? `/${id}` : ""}${quotes ? "/quotes" : ""}`, ids: id ? [id] : [], methods: quotes ? ["POST"] : ["GET"], input: quotes ? quoteInputSchema : undefined, response: quotes ? quoteSchema : id ? registrationSchema : registrationListSchema, paginated: !id });
}
