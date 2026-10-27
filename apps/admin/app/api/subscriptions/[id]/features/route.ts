import { handleAddon } from "@/features/subscriptions/handler";
export async function GET(request:Request,context:{params:Promise<{id:string}>}){const p=await context.params;return handleAddon(request,p.id);}
export async function POST(request:Request,context:{params:Promise<{id:string}>}){const p=await context.params;return handleAddon(request,p.id);}
