import { handlePlan } from "@/features/plans/handler";

export async function GET(request: Request) { return handlePlan(request); }
export async function POST(request: Request) { return handlePlan(request); }
