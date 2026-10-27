import { handleSubscription } from "@/features/subscriptions/handler";
export function GET(request:Request){return handleSubscription(request);}
export function POST(request:Request){return handleSubscription(request);}
