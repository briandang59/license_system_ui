import { handleUnit } from "@/features/units/handler";

export async function GET(request: Request) { return handleUnit(request); }
export async function POST(request: Request) { return handleUnit(request); }
