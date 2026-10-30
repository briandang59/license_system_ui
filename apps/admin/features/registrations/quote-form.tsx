"use client";
import { useRef, useState } from "react";
import { Alert, App, Button, Modal, Space, Table } from "antd";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import type { Dayjs } from "dayjs";
import FormInput from "@/components/form/form-input";
import FormInputNumber from "@/components/form/form-input-number";
import FormTextarea from "@/components/form/form-textarea";
import FormSelect from "@/components/form/form-select";
import FormDatePicker from "@/components/form/form-date-picker";
import { formatDateTime, isValidDateTime } from "@/utils/functions/formatDateTime";
import { getApiErrorMessage } from "@/lib/api-errors";
import { quoteInputSchema, type Registration, type QuoteInput } from "./schema";
import { registrationService } from "./service";

const formSchema = z.object({ ...quoteInputSchema.shape, expires_at: z.custom<Dayjs>(isValidDateTime, "Chọn ngày hết hạn hợp lệ.") });
export default function QuoteForm({ registration, onSaved }: { registration: Registration; onSaved: () => void }) {
 const last = registration.quotes[0]; const c = registration.configuration;
 const [preview, setPreview] = useState<QuoteInput | null>(null); const submitted = useRef<{ body: string; key: string } | null>(null);
 const client = useQueryClient(); const { message } = App.useApp();
 const { control, handleSubmit, formState: { errors } } = useForm<z.infer<typeof formSchema>>({ resolver: zodResolver(formSchema), defaultValues: { request_key: "00000000-0000-4000-8000-000000000000", currency: last?.currency ?? (c.currency || "VND"), billing_interval: last?.billing_interval ?? (c.billing_interval || "month") as "month", terms: last?.terms ?? "Giá và cấu hình áp dụng theo các hạng mục trên. Chưa kích hoạt dịch vụ. Bộ phận phụ trách sẽ hướng dẫn thanh toán và triển khai.", lines: last?.lines ?? [{ description: `${c.product_name} / ${c.plan_name || "Gói tùy chỉnh"}`, quantity: 1, unit_amount_minor: c.amount_minor ?? 0 }, ...c.features.map(f => ({ description: `${f.name}${f.limit_value !== null ? ` — Hạn mức ${f.limit_value}` : ""}`, quantity: f.quantity, unit_amount_minor: 0 }))] } });
 const lines = useFieldArray({ control, name: "lines" });
 const save = useMutation({ mutationFn: (input: QuoteInput) => registrationService.issue(registration.id, input), onError: e => void message.error(getApiErrorMessage(e)), onSuccess: async () => { void message.success("Đã lưu báo giá và đưa email kèm PDF vào hàng đợi gửi."); await client.invalidateQueries({ queryKey: ["registrations"] }); onSaved(); } });
 return <form noValidate onSubmit={event => void handleSubmit(values => {
  const input = { ...values, expires_at: values.expires_at.toISOString() }; const parsed = quoteInputSchema.safeParse(input);
  if (!parsed.success) { void message.error("Kiểm tra tổng tiền và thông tin báo giá."); return; }
  if (Date.parse(input.expires_at) <= Date.now() || Date.parse(input.expires_at) > Date.now() + 90 * 86400000) { void message.error("Ngày hết hạn phải trong vòng 90 ngày tới."); return; }
  const body = JSON.stringify({ ...input, request_key: undefined }); if (submitted.current?.body !== body) submitted.current = { body, key: crypto.randomUUID() };
  setPreview({ ...input, request_key: submitted.current.key });
 })(event)}>
 <Alert type="info" showIcon title="Mỗi lần gửi tạo một phiên bản cố định; link báo giá trước sẽ hết hiệu lực." description="Ghi đầy đủ tính năng và hạn mức cuối cùng trong từng hạng mục. Các dòng thêm sẵn chưa có giá cần được kiểm tra; 0 là miễn phí. Nêu rõ thuế, chiết khấu, phạm vi giá trong điều khoản." />
 {lines.fields.map((line, i) => <div key={line.id} style={{ paddingBlock: 16, borderBottom: "1px solid var(--line)" }}>
 <FormTextarea required control={control} name={`lines.${i}.description`} label={`Hạng mục ${i + 1}: cấu hình / tính năng / hạn mức`} disabled={save.isPending} />
 <div className="grid gap-4 sm:grid-cols-2"><FormInputNumber required control={control} name={`lines.${i}.quantity`} label="Số lượng" min={1} max={1000000} precision={0} disabled={save.isPending} /><FormInputNumber required control={control} name={`lines.${i}.unit_amount_minor`} label="Đơn giá (đơn vị tiền nhỏ nhất)" min={0} max={Number.MAX_SAFE_INTEGER} precision={0} disabled={save.isPending} /></div>
 <Button onClick={() => lines.remove(i)} disabled={save.isPending || lines.fields.length <= 1}>Bỏ hạng mục {i + 1}</Button></div>)}
 <Button className="my-4" disabled={save.isPending || lines.fields.length >= 100} onClick={() => lines.append({ description: "", quantity: 1, unit_amount_minor: 0 })}>Thêm hạng mục</Button>
 {errors.lines?.root?.message && <Alert type="error" title={errors.lines.root.message} />}
 <div className="grid gap-4 sm:grid-cols-2"><FormInput required control={control} name="currency" label="Tiền tệ (VND, USD...)" disabled={save.isPending} /><FormSelect required control={control} name="billing_interval" label="Chu kỳ thanh toán" options={[{ value: "month", label: "Hàng tháng" }, { value: "year", label: "Hàng năm" }, { value: "one_time", label: "Một lần" }]} disabled={save.isPending} /></div>
 <FormDatePicker required control={control} name="expires_at" label="Hiệu lực đến (giờ Việt Nam)" showTime disabled={save.isPending} />
 <FormTextarea required control={control} name="terms" label="Điều khoản / thuế / phạm vi giá" rows={4} disabled={save.isPending} />
 <Button htmlType="submit" type="primary" disabled={save.isPending}>Xem trước báo giá</Button>
 <Modal open={!!preview} title="Kiểm tra trước khi gửi" width={800} closable={!save.isPending} maskClosable={!save.isPending} onCancel={() => setPreview(null)} footer={<Space><Button disabled={save.isPending} onClick={() => setPreview(null)}>Chỉnh sửa</Button><Button type="primary" loading={save.isPending} onClick={() => { if (preview && !save.isPending) save.mutate(preview); }}>Gửi báo giá kèm PDF</Button></Space>}>
 {preview && <><p><strong>{registration.company_name}</strong> · {registration.email}</p><Table pagination={false} rowKey={(_, i) => String(i)} dataSource={preview.lines} columns={[{ title: "Hạng mục", dataIndex: "description" }, { title: "Số lượng", dataIndex: "quantity" }, { title: "Đơn giá (minor units)", dataIndex: "unit_amount_minor", render: (n: number) => n.toLocaleString("en-US") }]} /><p><strong>Tổng: {preview.lines.reduce((sum, l) => sum + l.quantity * l.unit_amount_minor, 0).toLocaleString("en-US")} minor units {preview.currency}</strong></p><p>Hiệu lực đến: {formatDateTime(preview.expires_at)}</p><p style={{ whiteSpace: "pre-wrap" }}>{preview.terms}</p></>}
 </Modal>
 </form>;
}
