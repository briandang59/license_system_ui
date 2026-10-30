import { handleSubscriptionEntitlements } from "@/features/payments/handler";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) { return handleSubscriptionEntitlements(request, (await params).id); }
