import { handleFeature } from "@/features/features/handler";

export async function GET(request: Request) { return handleFeature(request); }
export async function POST(request: Request) { return handleFeature(request); }
