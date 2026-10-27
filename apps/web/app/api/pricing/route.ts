import { handlePricing } from "@/features/pricing/handler";

export async function GET(request: Request) {
  return handlePricing(request);
}
