import { handlePricing } from "@/features/pricing/handler";
export async function GET(request:Request,context:{params:Promise<{id:string;priceId:string}>}){const p=await context.params;return handlePricing(request,"features",p.id,p.priceId);}
export async function PATCH(request:Request,context:{params:Promise<{id:string;priceId:string}>}){const p=await context.params;return handlePricing(request,"features",p.id,p.priceId);}
export async function DELETE(request:Request,context:{params:Promise<{id:string;priceId:string}>}){const p=await context.params;return handlePricing(request,"features",p.id,p.priceId);}
