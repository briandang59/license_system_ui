import { handlePaymentRequest } from "@/features/payments/handler";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) { return handlePaymentRequest(request, (await params).id); }
