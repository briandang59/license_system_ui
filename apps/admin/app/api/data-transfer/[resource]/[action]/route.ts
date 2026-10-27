import { handleTransfer } from "@/features/data-transfer/handler";
type Context={params:Promise<{resource:string;action:string}>};
export async function GET(request:Request,context:Context){const {resource,action}=await context.params;return handleTransfer(request,resource,action)}
export async function POST(request:Request,context:Context){const {resource,action}=await context.params;return handleTransfer(request,resource,action)}
