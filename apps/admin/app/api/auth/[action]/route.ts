import { handleAuth } from "@/features/auth/handler";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ action: string }> },
) {
  const { action } = await params;
  if (action !== "register" && action !== "logout" && action !== "refresh") {
    return new Response(null, { status: 404 });
  }
  return handleAuth(request, action);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ action: string }> },
) {
  const { action } = await params;
  if (action !== "me") return new Response(null, { status: 404 });
  return handleAuth(request, "me");
}
