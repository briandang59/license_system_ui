import { z } from "zod";
import { priceInputSchema } from "./schema";
import type { Dayjs } from "dayjs";
import { isValidDateTime } from "@/utils/functions/formatDateTime";

const date = z.custom<Dayjs>(isValidDateTime, "Chọn ngày giờ hợp lệ.");
export const priceEntrySchema = z.object({
  amount_minor: priceInputSchema.shape.amount_minor,
  currency: priceInputSchema.shape.currency,
  billing_interval: priceInputSchema.shape.billing_interval,
  status: priceInputSchema.shape.status,
  effective_from: date,
  effective_to: date.nullable(),
}).refine(value => !value.effective_to || value.effective_to.valueOf() > value.effective_from.valueOf(), {
  path: ["effective_to"], message: "Ngày kết thúc phải sau ngày bắt đầu.",
});
export const priceEntriesSchema = z.array(priceEntrySchema).superRefine((prices, context) => {
  prices.forEach((price, index) => {
    if (price.status === "inactive") return;
    const overlaps = prices.slice(0, index).some(previous => previous.status !== "inactive"
      && previous.currency === price.currency && previous.billing_interval === price.billing_interval
      && price.effective_from.valueOf() < (previous.effective_to?.valueOf() ?? Infinity)
      && previous.effective_from.valueOf() < (price.effective_to?.valueOf() ?? Infinity));
    if (overlaps) context.addIssue({ code: "custom", path: [index, "effective_from"],
      message: "Khoảng hiệu lực trùng với dòng giá cùng tiền tệ và chu kỳ ở trên." });
  });
});
export type PriceEntry = z.infer<typeof priceEntrySchema>;
