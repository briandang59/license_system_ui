import { handleSubscription } from "@/features/subscriptions/handler";
export async function GET(request:Request,context:{params:Promise<{id:string}>}){const p=await context.params;return handleSubscription(request,p.id);}
export async function PATCH(request:Request,context:{params:Promise<{id:string}>}){const p=await context.params;return handleSubscription(request,p.id);}
