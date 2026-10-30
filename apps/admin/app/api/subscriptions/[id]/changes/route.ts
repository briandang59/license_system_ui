import { handleSubscriptionChanges } from "@/features/payments/handler";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) { return handleSubscriptionChanges(request, (await params).id); }
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { return handleSubscriptionChanges(request, (await params).id); }
