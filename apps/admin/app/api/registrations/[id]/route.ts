import { handleRegistration } from "@/features/registrations/handler";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) { return handleRegistration(request, (await params).id); }
