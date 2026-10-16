import { handleAuth } from "@/features/auth/server/handler";

export async function POST(request: Request) {
  return handleAuth(request, "login");
}
