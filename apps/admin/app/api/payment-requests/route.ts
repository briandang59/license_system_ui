import { handlePaymentRequest } from "@/features/payments/handler";
export const GET = (request: Request) => handlePaymentRequest(request);
