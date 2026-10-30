import { handlePaymentReview } from "@/features/payments/handler";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { return handlePaymentReview(request, (await params).id); }
