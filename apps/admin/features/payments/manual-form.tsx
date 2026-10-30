"use client";
import { useState } from "react";
import { App, Button, Alert } from "antd";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import FormInput from "@/components/form/form-input";
import FormInputNumber from "@/components/form/form-input-number";
import FormSelect from "@/components/form/form-select";
import FormDatePicker from "@/components/form/form-date-picker";
import { isValidDateTime, parseDateTime } from "@/utils/functions/formatDateTime";
import type { Dayjs } from "dayjs";
import { getApiErrorMessage } from "@/lib/api-errors";
import { manualPaymentSchema, type PaymentRequest } from "./schema";
import { paymentService } from "./service";
const formSchema = z.object({ amount_minor: z.number().int().positive().max(Number.MAX_SAFE_INTEGER), method: z.enum(["cash", "bank_transfer"]), account_number: z.string().trim().max(100), reference: z.string().trim().max(200), note: z.string().trim().max(2000), received_at: z.custom<Dayjs>(isValidDateTime, "Chọn thời điểm nhận tiền hợp lệ.") }).superRefine((v, ctx) => { if (v.method === "bank_transfer") { if (!v.reference) ctx.addIssue({ code: "custom", path: ["reference"], message: "Nhập mã tham chiếu ngân hàng." }); if (!v.account_number) ctx.addIssue({ code: "custom", path: ["account_number"], message: "Nhập tài khoản nhận tiền." }); } });
export default function ManualPaymentForm({ request, onSaved }: { request: PaymentRequest; onSaved: () => void }) {
 const [requestKey] = useState(() => crypto.randomUUID());
 const { message } = App.useApp(); const client = useQueryClient();
 const { control, handleSubmit } = useForm<z.infer<typeof formSchema>>({ resolver: zodResolver(formSchema), defaultValues: { amount_minor: Math.max(0, request.amount_minor - request.paid_minor), method: "bank_transfer", account_number: "", reference: "", note: "", received_at: parseDateTime(new Date().toISOString())! } });
 const method = useWatch({ control, name: "method" });
 const save = useMutation({ mutationFn: (v: z.infer<typeof formSchema>) => paymentService.manual(request.id, manualPaymentSchema.parse({ ...v, received_at: v.received_at.toISOString(), request_key: requestKey })), onError: e => void message.error(getApiErrorMessage(e)), onSuccess: async () => { await Promise.all([client.invalidateQueries({ queryKey: ["payments"] }), client.invalidateQueries({ queryKey: ["subscriptions"] })]); void message.success("Đã ghi nhận khoản tiền thực nhận."); onSaved(); } });
 return <form noValidate onSubmit={handleSubmit(v => { if (!save.isPending) save.mutate(v); })}>
 <Alert className="mb-4" type="info" title="Chỉ xác nhận sau khi kiểm tra tiền thực nhận. Mã tham chiếu và tài khoản giúp tránh trùng với giao dịch SePay." />
 <FormInputNumber required control={control} name="amount_minor" label={`Số tiền thực nhận (${request.currency}, đơn vị nhỏ nhất)`} min={1} max={Number.MAX_SAFE_INTEGER} disabled={save.isPending} />
 <FormSelect required control={control} name="method" label="Phương thức" options={[{ value: "bank_transfer", label: "Chuyển khoản" }, { value: "cash", label: "Tiền mặt" }]} disabled={save.isPending} />
 <FormInput required={method === "bank_transfer"} control={control} name="account_number" label="Tài khoản nhận tiền (bắt buộc khi chuyển khoản)" disabled={save.isPending} />
 <FormInput required={method === "bank_transfer"} control={control} name="reference" label="Mã tham chiếu ngân hàng (bắt buộc khi chuyển khoản)" disabled={save.isPending} />
 <FormDatePicker required control={control} name="received_at" label="Thời điểm nhận tiền (giờ Việt Nam)" showTime disabled={save.isPending} />
 <FormInput control={control} name="note" label="Ghi chú" disabled={save.isPending} />
 <Button type="primary" htmlType="submit" loading={save.isPending}>Xác nhận đã nhận tiền</Button>
 </form>;
}
