"use client";
import { displayLabel } from "@/lib/display-labels";
import DataTransferActions from "@/features/data-transfer/actions";
import { useState } from "react";
import { Alert, App, Button, Modal, Popconfirm, Table } from "antd";
import { Pencil, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
z.config(z.locales.vi());
import FormDatePicker from "@/components/form/form-date-picker";
import { formatDateTime, parseDateTime, vietnamNow } from "@/utils/functions/formatDateTime";
import { formatNumber } from "@/utils/functions/formatNumber";
import { priceEntrySchema } from "./entry-schema";
import FormInput from "@/components/form/form-input";
import FormInputNumber from "@/components/form/form-input-number";
import FormSelect from "@/components/form/form-select";
import { getApiErrorMessage } from "@/lib/api-errors";
import { priceService } from "./service";
import type { Price } from "./schema";
const formSchema = priceEntrySchema.safeExtend({ status: z.enum(["active", "inactive"]) });
type Values = z.infer<typeof formSchema>;
function PriceForm({ kind, parent, price, onSaved }: {
    kind: "plans" | "features";
    parent: number;
    price?: Price;
    onSaved: () => void;
}) {
    const { message } = App.useApp();
    const client = useQueryClient();
    const { control, handleSubmit } = useForm<Values>({ resolver: zodResolver(formSchema), defaultValues: { amount_minor: price?.amount_minor ?? 0, currency: price?.currency ?? "VND", billing_interval: price?.billing_interval ?? "month", effective_from: parseDateTime(price?.effective_from) ?? vietnamNow(), effective_to: parseDateTime(price?.effective_to), status: price?.status ?? "active" } });
    const save = useMutation({ mutationFn: (v: Values) => { const to = v.effective_to?.toISOString() ?? null; return price ? priceService.update(kind, parent, price.id, { effective_to: to, status: v.status }) : priceService.create(kind, parent, { ...v, effective_from: v.effective_from.toISOString(), effective_to: to }); }, onError: e => void message.error(getApiErrorMessage(e)), onSuccess: async () => { void message.success(price ? "Đã cập nhật giá." : "Đã tạo giá."); await client.invalidateQueries({ queryKey: ["prices", kind, parent] }); onSaved(); } });
    return <form noValidate onSubmit={handleSubmit(v => { if (!save.isPending)
        save.mutate(v); })}><FormInputNumber control={control} name="amount_minor" label="Số tiền theo đơn vị nhỏ nhất" min={0} max={Number.MAX_SAFE_INTEGER} disabled={!!price || save.isPending}/><FormInput control={control} name="currency" label="Tiền tệ (3 chữ cái viết hoa)" disabled={!!price || save.isPending}/><FormSelect control={control} name="billing_interval" label="Chu kỳ thanh toán" options={[{ value: "month", label: "Hàng tháng" }, { value: "year", label: "Hàng năm" }, { value: "one_time", label: "Một lần" }]} disabled={!!price || save.isPending}/><FormDatePicker control={control} name="effective_from" label="Hiệu lực từ (giờ Việt Nam)" showTime disabled={!!price || save.isPending}/><FormDatePicker control={control} name="effective_to" label="Hiệu lực đến (giờ Việt Nam, có thể để trống)" showTime disabled={save.isPending}/><FormSelect control={control} name="status" label="Trạng thái" options={[{ value: "active", label: "Hoạt động" }, { value: "inactive", label: "Ngừng hoạt động" }]} disabled={save.isPending}/><p className="mb-4 text-sm text-muted">Muốn thay đổi số tiền, cần tạo giá mới. Các khoảng hiệu lực của cùng tiền tệ và chu kỳ thanh toán không được chồng lấn.</p><Button type="primary" htmlType="submit" loading={save.isPending}>Lưu giá</Button></form>;
}
export default function PricingPanel({ kind, parent, name }: {
    kind: "plans" | "features";
    parent: number;
    name: string;
}) {
    const [offset, setOffset] = useState(0);
    const [selection, setSelection] = useState<React.Key[]>([]);
    const [edit, setEdit] = useState<Price | "create" | null>(null);
    const { message } = App.useApp();
    const client = useQueryClient();
    const list = useQuery({ queryKey: ["prices", kind, parent, offset], queryFn: ({ signal }) => priceService.list(kind, parent, offset, signal) });
    const remove = useMutation({ mutationFn: (id: number) => priceService.remove(kind, parent, id), onError: e => void message.error(getApiErrorMessage(e)), onSuccess: async () => { void message.success("Đã xóa giá."); setSelection([]); if (list.data?.items.length === 1 && offset > 0)
            setOffset(offset - 20); await client.invalidateQueries({ queryKey: ["prices", kind, parent] }); } });
    return <section className="mt-6 border-t border-line pt-5"><div className="mb-4 flex items-center justify-between gap-3"><h3 className="text-lg font-semibold">Lịch sử giá</h3><DataTransferActions resource={kind === "plans" ? "plan-prices" : "feature-prices"} parentId={parent} filters={kind === "plans" ? {plan_id:String(parent)} : {feature_id:String(parent)}} /><Button onClick={() => setEdit("create")}>Thêm giá</Button></div>{list.isError && <Alert type="error" title={getApiErrorMessage(list.error)} action={<Button onClick={() => void list.refetch()}>Thử lại</Button>}/>}<Table<Price> size="small" rowKey="id" pagination={false} loading={list.isFetching} dataSource={list.data?.items ?? []} scroll={{ x: 700 }} rowSelection={{ selectedRowKeys: selection, onChange: setSelection }} columns={[{ title: "#", render: (_, __, i) => offset + i + 1 }, { title: "Số tiền (đơn vị nhỏ nhất)", render: (_, p) => `${formatNumber(p.amount_minor)} ${p.currency}` }, { title: "Thanh toán", dataIndex: "billing_interval", render: (value: string) => displayLabel(value) }, { title: "Từ ngày (giờ Việt Nam)", dataIndex: "effective_from", render: formatDateTime }, { title: "Đến ngày", render: (_, p) => p.effective_to ? formatDateTime(p.effective_to) : "Không có ngày kết thúc" }, { title: "Trạng thái", dataIndex: "status", render: (value: string) => displayLabel(value) }, { title: "Thao tác", render: (_, p) => <div className="flex gap-2"><Button icon={<Pencil size={16} aria-hidden/>} aria-label={`Sửa giá của ${name}`} title="Sửa giá" onClick={() => setEdit(p)}/><Popconfirm title="Xóa giá chưa được sử dụng?" onConfirm={() => { if (!remove.isPending)
                remove.mutate(p.id); }}><Button danger icon={<Trash2 size={16} aria-hidden/>} aria-label={`Xóa giá của ${name}`} title="Xóa giá" disabled={remove.isPending}/></Popconfirm></div> }]}/><div className="mt-3 flex justify-end gap-2"><Button disabled={!offset || list.isFetching} onClick={() => { setOffset(offset - 20); setSelection([]); }}>Trước</Button><Button disabled={list.isFetching || list.isError || (list.data?.items.length ?? 0) < 20} onClick={() => { setOffset(offset + 20); setSelection([]); }}>Tiếp</Button></div><Modal title={edit === "create" ? "Thêm giá" : "Sửa giá"} open={!!edit} footer={null} destroyOnHidden onCancel={() => setEdit(null)}>{edit && <PriceForm kind={kind} parent={parent} price={edit === "create" ? undefined : edit} onSaved={() => setEdit(null)}/>}</Modal></section>;
}
