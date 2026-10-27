import { handleFeature } from "@/features/features/handler";

type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, { params }: Context) {
  return handleFeature(request, (await params).id);
}
export async function PATCH(request: Request, { params }: Context) {
  return handleFeature(request, (await params).id);
}
export async function DELETE(request: Request, { params }: Context) {
  return handleFeature(request, (await params).id);
}
