import { handleManualPayment } from "@/features/payments/handler";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { return handleManualPayment(request, (await params).id); }
