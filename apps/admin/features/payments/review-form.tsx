"use client";
import { useState } from "react";
import { App, Button, Alert } from "antd";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import FormInput from "@/components/form/form-input";
import FormSelect from "@/components/form/form-select";
import { getApiErrorMessage } from "@/lib/api-errors";
import { reviewPaymentSchema, type ReviewPaymentInput, type PaymentTransaction } from "./schema";
import { paymentService } from "./service";
export default function ReviewForm({ transaction, onSaved }: { transaction: PaymentTransaction; onSaved: () => void }) {
 const [offset, setOffset] = useState(0); const client = useQueryClient(); const { message } = App.useApp();
 const requests = useQuery({ queryKey: ["payments", "options", offset], queryFn: ({ signal }) => paymentService.list(offset, "", undefined, signal) });
 const selected = useQuery({ queryKey: ["payments", "detail", transaction.payment_request_id], queryFn: ({ signal }) => paymentService.detail(transaction.payment_request_id!, signal), enabled: transaction.payment_request_id !== null });
 const { control, handleSubmit } = useForm<ReviewPaymentInput>({ resolver: zodResolver(reviewPaymentSchema), defaultValues: { payment_request_id: transaction.payment_request_id, status: "confirmed", note: "" } });
 const save = useMutation({ mutationFn: (v: ReviewPaymentInput) => paymentService.review(transaction.id, v), onError: e => void message.error(getApiErrorMessage(e)), onSuccess: async () => { await Promise.all([client.invalidateQueries({ queryKey: ["payments"] }), client.invalidateQueries({ queryKey: ["subscriptions"] })]); void message.success("Đã đối soát giao dịch."); onSaved(); } });
 const options = new Map((requests.data?.items ?? []).map(v => [v.id, v])); if (selected.data) options.set(selected.data.id, selected.data);
 return <form noValidate onSubmit={handleSubmit(v => { if (!save.isPending) save.mutate(v); })}>
 <Alert className="mb-4" type="warning" title="Kiểm tra giao dịch thủ công trước khi xác nhận. Một khoản chuyển tiền chỉ được tính một lần." />
 {requests.isError && <Alert type="error" title={getApiErrorMessage(requests.error)} action={<Button onClick={() => void requests.refetch()}>Thử lại</Button>} />}
 <FormSelect control={control} name="payment_request_id" label="Khoản cần thu" allowClear loading={requests.isFetching} disabled={save.isPending} options={[...options.values()].map(v => ({ value: v.id, label: `${v.payment_code} · ${v.company_name} · ${v.currency}` }))} />
 <div className="mb-4 flex gap-2"><Button disabled={!offset || requests.isFetching} onClick={() => setOffset(v => v - 20)}>Danh sách trước</Button><Button disabled={requests.isFetching || !requests.data || requests.data.items.length < 20} onClick={() => setOffset(v => v + 20)}>Danh sách tiếp</Button></div>
 <FormSelect control={control} name="status" label="Kết quả đối soát" options={[{ value: "confirmed", label: "Xác nhận tiền hợp lệ" }, { value: "rejected", label: "Không tính vào thanh toán" }]} disabled={save.isPending} />
 <FormInput control={control} name="note" label="Lý do / ghi chú đối soát" disabled={save.isPending} />
 <Button type="primary" htmlType="submit" loading={save.isPending}>Lưu kết quả đối soát</Button>
 </form>;
}
