import { handlePaymentTransactions } from "@/features/payments/handler";
export const GET = (request: Request) => handlePaymentTransactions(request);
