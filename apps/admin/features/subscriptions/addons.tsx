"use client";
import { z } from "zod";
import { useState, useEffect } from "react";
import { Alert, App, Button, Modal, Popconfirm, Table } from "antd";
import { Pencil, Trash2 } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import FormInputNumber from "@/components/form/form-input-number";
import FeatureSelect from "@/features/features/feature-select";
import FeatureContext from "@/features/features/feature-context";
import PlanContext from "@/features/plans/plan-context";
import PriceSelect from "@/features/pricing/price-select";
import { getApiErrorMessage } from "@/lib/api-errors";
import { addonInputSchema, type Addon, type AddonInput, type Subscription } from "./schema";
import { subscriptionService } from "./service";
const addonFormSchema = addonInputSchema.required({ quantity: true, limit_value: true });
function AddonForm({ subscription, item, onSaved }: {
    subscription: Subscription;
    item?: Addon;
    onSaved: () => void;
}) {
    const { message } = App.useApp();
    const client = useQueryClient();
    const { control, handleSubmit, setValue } = useForm<z.infer<typeof addonFormSchema>>({ resolver: zodResolver(addonFormSchema), defaultValues: { feature_id: item?.feature_id, price_id: item?.price_id, quantity: item?.quantity ?? 1, limit_value: item?.limit_value ?? null } });
    const feature = useWatch({ control, name: "feature_id" });
    useEffect(() => { if (!item) { setValue("price_id", 0); setValue("quantity", 1); setValue("limit_value", null); } }, [feature, item, setValue]);
    const save = useMutation({ mutationFn: (v: AddonInput) => item ? subscriptionService.edit(subscription.id, item.feature_id, { quantity: v.quantity, limit_value: v.limit_value }) : subscriptionService.add(subscription.id, v), onError: e => void message.error(getApiErrorMessage(e)), onSuccess: async () => { void message.success(item ? "Add-on updated." : "Add-on added."); await client.invalidateQueries({ queryKey: ["subscriptions", subscription.id, "addons"] }); onSaved(); } });
    return <form noValidate onSubmit={handleSubmit(v => { if (!save.isPending)
        save.mutate(v); })}><PlanContext id={subscription.plan_id}>{plan => <FeatureSelect control={control} name="feature_id" label="Feature" productId={plan.product_id} featureId={item?.feature_id} disabled={!!item || save.isPending}/>}</PlanContext>{!item && <PriceSelect kind="features" parent={feature} startDate={subscription.start_date} currency={subscription.currency} interval={subscription.billing_cycle} control={control} name="price_id" label="Compatible feature price" disabled={save.isPending}/>}<FeatureContext id={feature}>{f => f.feature_type === "quantity" ? <><FormInputNumber control={control} name="quantity" label="Purchased quantity" min={1} max={Number.MAX_SAFE_INTEGER} disabled={save.isPending}/><FormInputNumber control={control} name="limit_value" label="Entitlement limit (optional)" min={0} max={Number.MAX_SAFE_INTEGER} disabled={save.isPending}/></> : <p className="mb-4 text-sm text-muted">This feature is billed once per subscription and has no numeric limit.</p>}</FeatureContext><p className="my-4 text-sm text-muted">Quantity multiplies the price. The entitlement limit is a separate setting. To change the selected price, remove and add the item while pending.</p><Button type="primary" htmlType="submit" disabled={!feature || subscription.status !== "pending"} loading={save.isPending}>Save add-on</Button></form>;
}
export default function Addons({ subscription }: {
    subscription: Subscription;
}) {
    const [offset, setOffset] = useState(0);
    const [edit, setEdit] = useState<Addon | "create" | null>(null);
    const { message } = App.useApp();
    const client = useQueryClient();
    const pending = subscription.status === "pending";
    const list = useQuery({ queryKey: ["subscriptions", subscription.id, "addons", offset], queryFn: ({ signal }) => subscriptionService.addons(subscription.id, offset, signal) });
    const remove = useMutation({ mutationFn: (feature: number) => subscriptionService.remove(subscription.id, feature), onError: e => void message.error(getApiErrorMessage(e)), onSuccess: async () => { void message.success("Add-on removed."); if (list.data?.items.length === 1 && offset)
            setOffset(offset - 20); await client.invalidateQueries({ queryKey: ["subscriptions", subscription.id, "addons"] }); } });
    return <section className="mt-6 border-t border-line pt-4"><div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-semibold">Custom add-ons</h3><Button disabled={!pending || subscription.price_id === null} onClick={() => setEdit("create")}>Add feature</Button></div>{!pending && <p className="mb-4 text-muted">Add-ons can only change while the subscription is pending.</p>}{list.isError && <Alert type="error" title={getApiErrorMessage(list.error)} action={<Button onClick={() => void list.refetch()}>Retry</Button>}/>}<Table<Addon> rowKey="id" pagination={false} loading={list.isFetching} dataSource={list.data?.items ?? []} scroll={{ x: 600 }} columns={[{ title: "#", render: (_, __, i) => offset + i + 1 }, { title: "Feature", render: (_, item) => <FeatureContext id={item.feature_id}>{f => f.name}</FeatureContext> }, { title: "Unit price (minor)", render: (_, i) => `${i.amount_minor} ${i.currency}` }, { title: "Quantity", dataIndex: "quantity" }, { title: "Limit", render: (_, i) => i.limit_value ?? "Not configured" }, { title: "Line total (minor)", render: (_, i) => (BigInt(i.amount_minor) * BigInt(i.quantity)).toString() }, { title: "Actions", render: (_, i) => <div className="flex gap-2"><Button disabled={!pending} title="Edit add-on" aria-label="Edit add-on" icon={<Pencil size={16} aria-hidden/>} onClick={() => setEdit(i)}/><Popconfirm title="Remove add-on?" onConfirm={() => { if (!remove.isPending && pending)
                remove.mutate(i.feature_id); }}><Button danger disabled={!pending || remove.isPending} title="Remove add-on" aria-label="Remove add-on" icon={<Trash2 size={16} aria-hidden/>}/></Popconfirm></div> }]}/><div className="mt-3 flex justify-end gap-2"><Button disabled={!offset || list.isFetching} onClick={() => setOffset(offset - 20)}>Previous</Button><Button disabled={list.isFetching || list.isError || (list.data?.items.length ?? 0) < 20} onClick={() => setOffset(offset + 20)}>Next</Button></div><Modal title={edit === "create" ? "Add custom feature" : "Edit add-on"} open={!!edit && pending} onCancel={() => setEdit(null)} footer={null} destroyOnHidden>{edit && <AddonForm subscription={subscription} item={edit === "create" ? undefined : edit} onSaved={() => setEdit(null)}/>}</Modal></section>;
}
