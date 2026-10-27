import { handlePricing } from "@/features/pricing/handler";
export async function GET(request:Request,context:{params:Promise<{id:string}>}){const p=await context.params;return handlePricing(request,"features",p.id);}
export async function POST(request:Request,context:{params:Promise<{id:string}>}){const p=await context.params;return handlePricing(request,"features",p.id);}
