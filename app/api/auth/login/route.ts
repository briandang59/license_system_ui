import { handleAuth } from "@/features/auth/handler";

export async function POST(request: Request) {
  return handleAuth(request, "login");
}
