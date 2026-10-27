"use client";

import { Button } from "antd";
import { vietnamNow } from "@/utils/functions/formatDateTime";
import FormDatePicker from "@/components/form/form-date-picker";
import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useFormContext } from "react-hook-form";
import FormInput from "@/components/form/form-input";
import FormInputNumber from "@/components/form/form-input-number";
import FormSelect from "@/components/form/form-select";
import type { PriceEntry } from "./entry-schema";

export { priceEntriesSchema } from "./entry-schema";
export { saveWithPrices } from "./save-with-prices";
export type { PriceEntry } from "./entry-schema";

export default function PriceEntryFields({ disabled, existing }: { disabled: boolean; existing: boolean }) {
  const { control } = useFormContext<{ prices: PriceEntry[] }>();
  const { fields, append, remove } = useFieldArray({ control, name: "prices" });
  return <section className="my-5 border-t border-line pt-5" aria-label="Nhập giá">
    <div className="mb-3 flex items-center justify-between gap-3">
      <h3 className="text-base font-semibold">{existing ? "Thêm giá mới" : "Giá bán"}</h3>
      <Button disabled={disabled} icon={<Plus size={16} aria-hidden="true" />} onClick={() => append({
        amount_minor: 0, currency: "VND", billing_interval: "month",
        effective_from: vietnamNow(), effective_to: null, status: "active",
      })}>Thêm dòng giá</Button>
    </div>
    <p className="mb-4 text-sm text-muted">Nhập giá tháng, năm hoặc một lần rồi lưu cùng thông tin. Giá 0 là miễn phí. Số tiền theo đơn vị nhỏ nhất: VND nhập số đồng, USD nhập số cent.</p>
    {existing && <p className="mb-4 text-sm text-muted">Giá hiện có được giữ nguyên. Xem hoặc kết thúc hiệu lực giá cũ tại Chi tiết → Lịch sử giá trước khi thêm giá cùng tiền tệ và chu kỳ.</p>}
    {!fields.length && <p className="mb-4 text-sm text-muted">Chưa có dòng giá mới. Chọn Thêm dòng giá để nhập.</p>}
    {fields.map((field, index) => <fieldset key={field.id} disabled={disabled} className="mb-4 border-b border-line pb-2">
      <legend className="mb-2 flex w-full items-center justify-between text-sm font-medium">
        Giá {index + 1}
        <Button size="small" disabled={disabled} icon={<Trash2 size={14} aria-hidden="true" />}
          aria-label={`Bỏ dòng giá ${index + 1}`} onClick={() => remove(index)} />
      </legend>
      <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <FormInputNumber control={control} name={`prices.${index}.amount_minor`} label="Số tiền (đơn vị nhỏ nhất)" min={0} max={Number.MAX_SAFE_INTEGER} precision={0} disabled={disabled} />
        <FormInput control={control} name={`prices.${index}.currency`} label="Tiền tệ" maxLength={3} placeholder="VND, USD…" disabled={disabled} />
        <FormSelect control={control} name={`prices.${index}.billing_interval`} label="Chu kỳ thanh toán" disabled={disabled}
          options={[{ value: "month", label: "Hàng tháng" }, { value: "year", label: "Hàng năm" }, { value: "one_time", label: "Một lần" }]} />
        <FormSelect control={control} name={`prices.${index}.status`} label="Trạng thái giá" disabled={disabled}
          options={[{ value: "active", label: "Hoạt động" }, { value: "inactive", label: "Ngừng hoạt động" }]} />
        <FormDatePicker control={control} name={`prices.${index}.effective_from`} label="Hiệu lực từ (giờ Việt Nam)" showTime disabled={disabled} />
        <FormDatePicker control={control} name={`prices.${index}.effective_to`} label="Hiệu lực đến (giờ Việt Nam, có thể để trống)" showTime disabled={disabled} />
      </div>
    </fieldset>)}
  </section>;
}
