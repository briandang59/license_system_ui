"use client";
import { useState } from "react";
import { Alert, App, Button, Modal, Popconfirm, Table } from "antd";
import { Pencil, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import FormInput from "@/components/form/form-input";
import FormInputNumber from "@/components/form/form-input-number";
import FormSelect from "@/components/form/form-select";
import { getApiErrorMessage } from "@/lib/api-errors";
import { priceService } from "./service";
import type { Price } from "./schema";
const date = z.string().refine(v => !Number.isNaN(Date.parse(v)), "Enter a date");
const formSchema = z.object({ amount_minor: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER), currency: z.string().regex(/^[A-Z]{3}$/), billing_interval: z.enum(["month", "year", "one_time"]), effective_from: date, effective_to: z.string().refine(v => !v || !Number.isNaN(Date.parse(v)), "Enter a date"), status: z.enum(["active", "inactive"]) }).refine(v => !v.effective_to || Date.parse(v.effective_to) > Date.parse(v.effective_from), { path: ["effective_to"], message: "End must follow start" });
type Values = z.infer<typeof formSchema>;
function PriceForm({ kind, parent, price, onSaved }: {
    kind: "plans" | "features";
    parent: number;
    price?: Price;
    onSaved: () => void;
}) {
    const { message } = App.useApp();
    const client = useQueryClient();
    const { control, handleSubmit } = useForm<Values>({ resolver: zodResolver(formSchema), defaultValues: { amount_minor: price?.amount_minor ?? 0, currency: price?.currency ?? "USD", billing_interval: price?.billing_interval ?? "month", effective_from: price?.effective_from ?? new Date().toISOString(), effective_to: price?.effective_to ?? "", status: price?.status ?? "active" } });
    const save = useMutation({ mutationFn: (v: Values) => { const to = v.effective_to ? new Date(v.effective_to).toISOString() : null; return price ? priceService.update(kind, parent, price.id, { effective_to: to, status: v.status }) : priceService.create(kind, parent, { ...v, effective_from: new Date(v.effective_from).toISOString(), effective_to: to }); }, onError: e => void message.error(getApiErrorMessage(e)), onSuccess: async () => { void message.success(price ? "Price updated." : "Price created."); await client.invalidateQueries({ queryKey: ["prices", kind, parent] }); onSaved(); } });
    return <form noValidate onSubmit={handleSubmit(v => { if (!save.isPending)
        save.mutate(v); })}><FormInputNumber control={control} name="amount_minor" label="Amount in minor units" min={0} max={Number.MAX_SAFE_INTEGER} disabled={!!price || save.isPending}/><FormInput control={control} name="currency" label="Currency (3 uppercase letters)" disabled={!!price || save.isPending}/><FormSelect control={control} name="billing_interval" label="Billing period" options={[{ value: "month", label: "Monthly" }, { value: "year", label: "Yearly" }, { value: "one_time", label: "One-time" }]} disabled={!!price || save.isPending}/><FormInput control={control} name="effective_from" label="Effective from (ISO date with timezone)" disabled={!!price || save.isPending}/><FormInput control={control} name="effective_to" label="Effective to (ISO date; leave empty for no end)" disabled={save.isPending}/><FormSelect control={control} name="status" label="Status" options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} disabled={save.isPending}/><p className="mb-4 text-sm text-muted">Changing the amount requires a new price. Active periods for the same currency and billing period must not overlap.</p><Button type="primary" htmlType="submit" loading={save.isPending}>Save price</Button></form>;
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
    const remove = useMutation({ mutationFn: (id: number) => priceService.remove(kind, parent, id), onError: e => void message.error(getApiErrorMessage(e)), onSuccess: async () => { void message.success("Price deleted."); setSelection([]); if (list.data?.items.length === 1 && offset > 0)
            setOffset(offset - 20); await client.invalidateQueries({ queryKey: ["prices", kind, parent] }); } });
    return <section className="mt-6 border-t border-line pt-5"><div className="mb-4 flex items-center justify-between gap-3"><h3 className="text-lg font-semibold">Price history</h3><Button onClick={() => setEdit("create")}>Add price</Button></div>{list.isError && <Alert type="error" title={getApiErrorMessage(list.error)} action={<Button onClick={() => void list.refetch()}>Retry</Button>}/>}<Table<Price> size="small" rowKey="id" pagination={false} loading={list.isFetching} dataSource={list.data?.items ?? []} scroll={{ x: 700 }} rowSelection={{ selectedRowKeys: selection, onChange: setSelection }} columns={[{ title: "#", render: (_, __, i) => offset + i + 1 }, { title: "Amount (minor units)", render: (_, p) => `${p.amount_minor} ${p.currency}` }, { title: "Billing", dataIndex: "billing_interval" }, { title: "From", dataIndex: "effective_from" }, { title: "To", render: (_, p) => p.effective_to ?? "No end" }, { title: "Status", dataIndex: "status" }, { title: "Actions", render: (_, p) => <div className="flex gap-2"><Button icon={<Pencil size={16} aria-hidden/>} aria-label={`Edit price for ${name}`} title="Edit price" onClick={() => setEdit(p)}/><Popconfirm title="Delete unused price?" onConfirm={() => { if (!remove.isPending)
                remove.mutate(p.id); }}><Button danger icon={<Trash2 size={16} aria-hidden/>} aria-label={`Delete price for ${name}`} title="Delete price" disabled={remove.isPending}/></Popconfirm></div> }]}/><div className="mt-3 flex justify-end gap-2"><Button disabled={!offset || list.isFetching} onClick={() => { setOffset(offset - 20); setSelection([]); }}>Previous</Button><Button disabled={list.isFetching || list.isError || (list.data?.items.length ?? 0) < 20} onClick={() => { setOffset(offset + 20); setSelection([]); }}>Next</Button></div><Modal title={edit === "create" ? "Add price" : "Edit price"} open={!!edit} footer={null} destroyOnHidden onCancel={() => setEdit(null)}>{edit && <PriceForm kind={kind} parent={parent} price={edit === "create" ? undefined : edit} onSaved={() => setEdit(null)}/>}</Modal></section>;
}
