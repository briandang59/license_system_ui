import { handlePublicRegistration } from "@/features/registrations/handler";
export function POST(request: Request) { return handlePublicRegistration(request, "create"); }
