import { handlePlan } from "@/features/plans/handler";

type Context = { params: Promise<{ id: string; featureId: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const { id, featureId } = await params;
  return handlePlan(request, id, "features", featureId);
}
