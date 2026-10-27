import { z } from "zod";
import { quoteSchema, receiptSchema, registrationInputSchema, tokenSchema, type RegistrationInput } from "./schema";
import { registrationUrls } from "./urls";
async function post<T>(url: string, body: unknown, schema: z.ZodType<T>, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal });
  const data = z.object({ success: z.boolean(), data: z.unknown().optional() }).parse(await res.json());
  if (!res.ok || !data.success) throw new Error(res.status === 409 ? "Báo giá đã hết hạn, được thay thế hoặc yêu cầu đã được xử lý. Vui lòng liên hệ hỗ trợ." : res.status === 429 ? "Bạn gửi quá nhiều yêu cầu. Vui lòng thử lại sau." : "Không thể hoàn tất yêu cầu. Vui lòng kiểm tra thông tin và thử lại.");
  return schema.parse(data.data);
}
export const registrationService = {
  create: (input: RegistrationInput) => post(registrationUrls.create, registrationInputSchema.parse(input), receiptSchema),
  view: (token: string, signal?: AbortSignal) => post(registrationUrls.view, tokenSchema.parse({ token }), quoteSchema, signal),
  accept: (token: string) => post(registrationUrls.accept, tokenSchema.parse({ token }), quoteSchema),
};
