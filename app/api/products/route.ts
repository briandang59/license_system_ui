import { handleProduct } from "@/features/products/server/handler";

export async function GET(request: Request) { return handleProduct(request); }
export async function POST(request: Request) { return handleProduct(request); }
