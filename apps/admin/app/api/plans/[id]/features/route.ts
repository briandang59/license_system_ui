import { handlePlan } from "@/features/plans/handler";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Context) {
  return handlePlan(request, (await params).id, "features");
}

export async function POST(request: Request, { params }: Context) {
  return handlePlan(request, (await params).id, "features");
}
