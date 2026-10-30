"use client";
import { useState } from "react";
import { Alert, App, Button, Modal, Table } from "antd";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import FormInput from "@/components/form/form-input";
import FormInputNumber from "@/components/form/form-input-number";
import FormSwitch from "@/components/form/form-switch";
import FeatureSelect from "@/features/features/feature-select";
import FeatureContext from "@/features/features/feature-context";
import { getApiErrorMessage } from "@/lib/api-errors";
import { formatNumber } from "@/utils/functions/formatNumber";

import { changeInputSchema, type ChangeInput, type SubscriptionChange, type Entitlement } from "./schema";
import { paymentService } from "./service";
import { changeColumns, entitlementColumns } from "./columns";
import { PaymentRequests } from "./page";
function ChangeForm({ subscriptionId, productId, currency, onSaved }: { subscriptionId: number; productId: number; currency: string; onSaved: () => void }) {
 const [key] = useState(() => crypto.randomUUID()); const { message } = App.useApp(); const client = useQueryClient();
 const { control, handleSubmit, setValue } = useForm<ChangeInput>({ resolver: zodResolver(changeInputSchema), defaultValues: { request_key: key, description: "", confirmation_note: "", amount_minor: 0, currency, items: [{ feature_id: 0, enabled: true, limit_value: null }] } });
 const { fields, append, remove } = useFieldArray({ control, name: "items" });
 const watchedItems = useWatch({ control, name: "items" });
 const save = useMutation({ mutationFn: (v: ChangeInput) => paymentService.createChange(subscriptionId, v), onError: e => void message.error(getApiErrorMessage(e)), onSuccess: async () => { await Promise.all([client.invalidateQueries({ queryKey: ["payments"] }), client.invalidateQueries({ queryKey: ["subscriptions"] })]); void message.success("Đã tạo bổ sung chờ thanh toán."); onSaved(); } });
 return <form noValidate onSubmit={handleSubmit(v => { if (!save.isPending) save.mutate(v); })}>
 <Alert className="mb-4" type="info" title="Nhập thỏa thuận đã được khách xác nhận. Số tiền được chốt thủ công; quyền chỉ áp dụng khi thu đủ. Hạn mức là giá trị mới thay thế, không phải số cộng thêm. Thời hạn hợp đồng hiện tại được giữ nguyên." />
 <FormInput control={control} name="description" label="Nội dung báo giá bổ sung" disabled={save.isPending} />
 <FormInput control={control} name="confirmation_note" label="Bằng chứng / ghi chú khách đã xác nhận" disabled={save.isPending} />
 <FormInputNumber control={control} name="amount_minor" label={`Tổng cần thu (${currency}, đơn vị nhỏ nhất)`} min={1} max={Number.MAX_SAFE_INTEGER} disabled={save.isPending} />
 {fields.map((field, index) => <div key={field.id} className="mb-4 rounded-lg border border-line p-4">
 <FeatureSelect control={control} name={`items.${index}.feature_id`} label={`Tính năng ${index + 1}`} productId={productId} disabled={save.isPending} />
 <FormSwitch control={control} name={`items.${index}.enabled`} label="Cho phép sử dụng" disabled={save.isPending} />
 <FeatureContext id={watchedItems[index]?.feature_id}>{feature => feature.feature_type === "quantity" ? <FormInputNumber control={control} name={`items.${index}.limit_value`} label="Hạn mức mới (để trống nếu chưa cấu hình)" min={0} max={Number.MAX_SAFE_INTEGER} disabled={save.isPending} /> : <Button disabled={save.isPending || watchedItems[index]?.limit_value === null} onClick={() => setValue(`items.${index}.limit_value`, null)}>Xóa hạn mức cho tính năng không định lượng</Button>}</FeatureContext>
 <Button danger disabled={save.isPending || fields.length === 1} onClick={() => remove(index)}>Bỏ tính năng này</Button>
 </div>)}
 <div className="mb-4 flex flex-wrap gap-3"><Button disabled={save.isPending || fields.length >= 100} onClick={() => append({ feature_id: 0, enabled: true, limit_value: null })}>Thêm tính năng</Button><Button type="primary" htmlType="submit" loading={save.isPending}>Tạo bổ sung và khoản cần thu</Button></div>
 </form>;
}
export default function SubscriptionPayments({ subscriptionId, productId, currency, active }: { subscriptionId: number; productId?: number; currency: string | null; active: boolean }) {
 const [open, setOpen] = useState(false); const [offset, setOffset] = useState(0);
 const changes = useQuery({ queryKey: ["payments", "changes", subscriptionId, offset], queryFn: ({ signal }) => paymentService.changes(subscriptionId, offset, signal) });
 const pending = changes.data?.items.some(v => v.status === "pending_payment");
 return <section className="mt-8"><Entitlements subscriptionId={subscriptionId} active={active} /><h2 className="mb-4 text-lg font-semibold">Thanh toán hợp đồng</h2><PaymentRequests subscriptionId={subscriptionId} /><div className="my-4 flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">Lịch sử bổ sung</h2><Button disabled={!active || !productId || pending} onClick={() => setOpen(true)}>Lập bổ sung đã xác nhận</Button></div>
 {changes.isError && <Alert type="error" title={getApiErrorMessage(changes.error)} action={<Button onClick={() => void changes.refetch()}>Thử lại</Button>} />}
 <Table<SubscriptionChange> rowKey="id" pagination={false} loading={changes.isFetching} dataSource={changes.data?.items ?? []} scroll={{ x: 650 }} columns={changeColumns(offset)} expandable={{ expandedRowRender: v => <><p>{v.confirmation_note}</p><ul>{v.items.map(i => <li key={i.feature_id}>{i.feature_name}: {i.enabled ? "Cho phép" : "Tắt"} · Hạn mức {i.limit_value === null ? "chưa cấu hình" : formatNumber(i.limit_value)}</li>)}</ul></> }} />
 <div className="my-4 flex justify-end gap-2"><Button disabled={!offset || changes.isFetching} onClick={() => setOffset(v => v - 20)}>Trước</Button><Button disabled={changes.isFetching || changes.isError || (changes.data?.items.length ?? 0) < 20} onClick={() => setOffset(v => v + 20)}>Tiếp</Button></div>
 <Modal title="Bổ sung đăng ký dịch vụ" width={700} open={open} onCancel={() => setOpen(false)} footer={null} destroyOnHidden>{open && productId && <ChangeForm subscriptionId={subscriptionId} productId={productId} currency={currency ?? "VND"} onSaved={() => setOpen(false)} />}</Modal>
 </section>;
}
function Entitlements({ subscriptionId, active }: { subscriptionId: number; active: boolean }) {
 const [offset, setOffset] = useState(0); const list = useQuery({ queryKey: ["payments", "entitlements", subscriptionId, offset], queryFn: ({ signal }) => paymentService.entitlements(subscriptionId, offset, signal) });
 return <><h2 className="mb-4 text-lg font-semibold">Quyền theo hợp đồng</h2>{!active && <p className="mb-3 text-muted">Các quyền dưới đây chưa được kích hoạt khi đăng ký dịch vụ chưa hoạt động.</p>}{list.isError && <Alert type="error" title={getApiErrorMessage(list.error)} action={<Button onClick={() => void list.refetch()}>Thử lại</Button>} />}<Table<Entitlement> rowKey="feature_id" pagination={false} loading={list.isFetching} dataSource={list.data?.items ?? []} columns={entitlementColumns(offset)} /><div className="my-4 flex justify-end gap-2"><Button disabled={!offset || list.isFetching} onClick={() => setOffset(v => v - 20)}>Trước</Button><Button disabled={list.isFetching || list.isError || (list.data?.items.length ?? 0) < 20} onClick={() => setOffset(v => v + 20)}>Tiếp</Button></div></>;
}
