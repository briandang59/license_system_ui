import { handleRegistration } from "@/features/registrations/handler";
export function GET(request: Request) { return handleRegistration(request); }
