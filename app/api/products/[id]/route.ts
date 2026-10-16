import { handleProduct } from "@/features/products/server/handler";

type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, { params }: Context) {
  return handleProduct(request, (await params).id);
}
export async function PATCH(request: Request, { params }: Context) {
  return handleProduct(request, (await params).id);
}
export async function DELETE(request: Request, { params }: Context) {
  return handleProduct(request, (await params).id);
}
