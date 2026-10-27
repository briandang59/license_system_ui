import { handleAddon } from "@/features/subscriptions/handler";
export async function GET(request:Request,context:{params:Promise<{id:string;featureId:string}>}){const p=await context.params;return handleAddon(request,p.id,p.featureId);}
export async function PATCH(request:Request,context:{params:Promise<{id:string;featureId:string}>}){const p=await context.params;return handleAddon(request,p.id,p.featureId);}
export async function DELETE(request:Request,context:{params:Promise<{id:string;featureId:string}>}){const p=await context.params;return handleAddon(request,p.id,p.featureId);}
