"use client";
import DataTransferActions from "@/features/data-transfer/actions";
import { z } from "zod";
import { useState } from "react";
import { Alert, App, Button, Descriptions, Modal, Select, Spin, Table } from "antd";
import { Eye } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import FormInput from "@/components/form/form-input";
import FormSelect from "@/components/form/form-select";
import FormSwitch from "@/components/form/form-switch";
import { getApiErrorMessage } from "@/lib/api-errors";
import { subscriptionService } from "./service";
import { transitions, type Subscription, type SubscriptionUpdate } from "./schema";
import SubscriptionForm from "./form";
import Addons from "./addons";
const lifecycleSchema = z.object({ status: z.enum(["pending", "active", "past_due", "cancel", "expired"]), auto_renew: z.boolean(), end_date: z.union([z.literal(""), z.iso.datetime({ offset: true })]) });
function LifecycleForm({ subscription }: {
    subscription: Subscription;
}) {
    const { message } = App.useApp();
    const client = useQueryClient();
    const { control, handleSubmit } = useForm<z.infer<typeof lifecycleSchema>>({ resolver: zodResolver(lifecycleSchema), defaultValues: { status: subscription.status, auto_renew: subscription.auto_renew, end_date: subscription.end_date ?? "" } });
    const save = useMutation({ mutationFn: (v: SubscriptionUpdate) => subscriptionService.update(subscription.id, { ...v, end_date: v.end_date || null }), onError: e => void message.error(getApiErrorMessage(e)), onSuccess: async () => { void message.success("Subscription updated."); await client.invalidateQueries({ queryKey: ["subscriptions"] }); } });
    return <form className="mt-6" noValidate onSubmit={handleSubmit(v => { if (!save.isPending)
        save.mutate(v); })}><FormSelect control={control} name="status" label="Status" options={transitions[subscription.status].map(s => ({ value: s, label: s }))} disabled={save.isPending}/><FormInput control={control} name="end_date" label="End date (ISO with timezone; clear to remove)" disabled={save.isPending}/><FormSwitch control={control} name="auto_renew" label="Auto renew" disabled={save.isPending}/><Button htmlType="submit" type="primary" loading={save.isPending}>Save changes</Button></form>;
}
export default function SubscriptionsPage() {
    const [offset, setOffset] = useState(0);
    const [status, setStatus] = useState("");
    const [selected, setSelected] = useState<React.Key[]>([]);
    const [dialog, setDialog] = useState<number | "create" | null>(null);
    const list = useQuery({ queryKey: ["subscriptions", "list", offset, status], queryFn: ({ signal }) => subscriptionService.list(offset, status, signal) });
    const detail = useQuery({ queryKey: ["subscriptions", "detail", dialog], queryFn: ({ signal }) => subscriptionService.detail(dialog as number, signal), enabled: typeof dialog === "number", staleTime: 0 });
    return <div><div className="mb-6 flex items-center justify-between"><div><h1 className="text-2xl font-semibold">Subscriptions</h1><p className="mt-2 text-muted">Manage pricing snapshots, lifecycle and custom add-ons.</p></div><div className="flex flex-wrap gap-3"><DataTransferActions resource="subscriptions" filters={{status}} exportOnly /><Button type="primary" onClick={() => setDialog("create")}>Add subscription</Button></div></div><Select aria-label="Filter by status" className="mb-4" style={{ minWidth: 180 }} value={status} onChange={v => { setStatus(v); setOffset(0); setSelected([]); }} options={[{ value: "", label: "All statuses" }, ...Object.keys(transitions).map(s => ({ value: s, label: s }))]}/>{list.isError && <Alert type="error" title={getApiErrorMessage(list.error)} action={<Button onClick={() => void list.refetch()}>Retry</Button>}/>}<Table<Subscription> rowKey="id" pagination={false} loading={list.isFetching} dataSource={list.data?.items ?? []} rowSelection={{ selectedRowKeys: selected, onChange: setSelected }} scroll={{ x: 800 }} columns={[{ title: "#", render: (_, __, i) => offset + i + 1 }, { title: "Company", render: (_, s) => s.company?.name ?? "Unavailable" }, { title: "Plan", render: (_, s) => s.plan?.name ?? "Unavailable" }, { title: "Snapshot (minor units)", render: (_, s) => s.amount_minor === null ? "Unpriced" : `${s.amount_minor} ${s.currency}` }, { title: "Billing", dataIndex: "billing_cycle" }, { title: "Status", dataIndex: "status" }, { title: "Start", dataIndex: "start_date" }, { title: "Actions", render: (_, s) => <Button title="View subscription" aria-label={`View subscription for ${s.company?.name ?? "company"}`} icon={<Eye size={16} aria-hidden/>} onClick={() => setDialog(s.id)}/> }]}/><div className="mt-4 flex justify-end gap-2"><Button disabled={!offset || list.isFetching} onClick={() => { setOffset(offset - 20); setSelected([]); }}>Previous</Button><Button disabled={list.isFetching || list.isError || (list.data?.items.length ?? 0) < 20} onClick={() => { setOffset(offset + 20); setSelected([]); }}>Next</Button></div><Modal title={dialog === "create" ? "Add subscription" : "Subscription details"} width={960} open={dialog !== null} onCancel={() => setDialog(null)} footer={null} destroyOnHidden>{dialog === "create" ? <SubscriptionForm onSaved={() => setDialog(null)}/> : detail.isPending ? <Spin aria-label="Loading subscription"/> : detail.isError ? <Alert type="error" title={getApiErrorMessage(detail.error)} action={<Button onClick={() => void detail.refetch()}>Retry</Button>}/> : detail.data && <><Descriptions column={2} items={[{ key: "amount", label: "Price snapshot", children: detail.data.amount_minor === null ? "Unpriced" : `${detail.data.amount_minor} ${detail.data.currency} minor units` }, { key: "cycle", label: "Billing", children: detail.data.billing_cycle }, { key: "start", label: "Start", children: detail.data.start_date }, { key: "end", label: "End", children: detail.data.end_date ?? "No end" }]}/><LifecycleForm key={detail.data.updated_at} subscription={detail.data}/><Addons subscription={detail.data}/></>}</Modal></div>;
}
