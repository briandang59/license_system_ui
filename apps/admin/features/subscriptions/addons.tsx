"use client";
import { formatNumber } from "@/utils/functions/formatNumber";
import DataTransferActions from "@/features/data-transfer/actions";
import { z } from "zod";
z.config(z.locales.vi());
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
    const save = useMutation({ mutationFn: (v: AddonInput) => item ? subscriptionService.edit(subscription.id, item.feature_id, { quantity: v.quantity, limit_value: v.limit_value }) : subscriptionService.add(subscription.id, v), onError: e => void message.error(getApiErrorMessage(e)), onSuccess: async () => { void message.success(item ? "Đã cập nhật tính năng bổ sung." : "Đã thêm tính năng bổ sung."); await client.invalidateQueries({ queryKey: ["subscriptions", subscription.id, "addons"] }); onSaved(); } });
    return <form noValidate onSubmit={handleSubmit(v => { if (!save.isPending)
        save.mutate(v); })}><PlanContext id={subscription.plan_id}>{plan => <FeatureSelect required control={control} name="feature_id" label="Tính năng" productId={plan.product_id} featureId={item?.feature_id} disabled={!!item || save.isPending}/>}</PlanContext>{!item && <PriceSelect kind="features" parent={feature} startDate={subscription.start_date ?? ""} currency={subscription.currency} interval={subscription.billing_cycle} required control={control} name="price_id" label="Giá tính năng phù hợp" disabled={save.isPending}/>}<FeatureContext id={feature}>{f => f.feature_type === "quantity" ? <><FormInputNumber required control={control} name="quantity" label="Số lượng mua" min={1} max={Number.MAX_SAFE_INTEGER} disabled={save.isPending}/><FormInputNumber control={control} name="limit_value" label="Hạn mức quyền lợi (không bắt buộc)" min={0} max={Number.MAX_SAFE_INTEGER} disabled={save.isPending}/></> : <p className="mb-4 text-sm text-muted">Tính năng này tính phí một lần cho mỗi đăng ký dịch vụ và không có hạn mức số lượng.</p>}</FeatureContext><p className="my-4 text-sm text-muted">Số lượng mua được nhân với đơn giá. Hạn mức quyền lợi được cấu hình riêng. Để đổi giá, hãy xóa và thêm lại khi đăng ký đang chờ xử lý.</p><Button type="primary" htmlType="submit" disabled={!feature || subscription.status !== "pending"} loading={save.isPending}>Lưu tính năng bổ sung</Button></form>;
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
    const remove = useMutation({ mutationFn: (feature: number) => subscriptionService.remove(subscription.id, feature), onError: e => void message.error(getApiErrorMessage(e)), onSuccess: async () => { void message.success("Đã xóa tính năng bổ sung."); if (list.data?.items.length === 1 && offset)
            setOffset(offset - 20); await client.invalidateQueries({ queryKey: ["subscriptions", subscription.id, "addons"] }); } });
    return <section className="mt-6 border-t border-line pt-4"><div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-semibold">Tính năng bổ sung tùy chỉnh</h3><DataTransferActions resource="subscription-features" filters={{subscription_id:String(subscription.id)}} exportOnly /><Button disabled={!pending || subscription.price_id === null} onClick={() => setEdit("create")}>Thêm tính năng</Button></div>{!pending && <p className="mb-4 text-muted">Chỉ có thể thay đổi tính năng bổ sung khi đăng ký dịch vụ đang chờ xử lý.</p>}{list.isError && <Alert type="error" title={getApiErrorMessage(list.error)} action={<Button onClick={() => void list.refetch()}>Thử lại</Button>}/>}<Table<Addon> rowKey="id" pagination={false} loading={list.isFetching} dataSource={list.data?.items ?? []} scroll={{ x: 600 }} columns={[{ title: "#", render: (_, __, i) => offset + i + 1 }, { title: "Tính năng", render: (_, item) => <FeatureContext id={item.feature_id}>{f => f.name}</FeatureContext> }, { title: "Đơn giá (đơn vị nhỏ nhất)", render: (_, i) => `${formatNumber(i.amount_minor)} ${i.currency}` }, { title: "Số lượng", dataIndex: "quantity", render: formatNumber }, { title: "Hạn mức", render: (_, i) => i.limit_value === null ? "Chưa cấu hình" : formatNumber(i.limit_value) }, { title: "Thành tiền (đơn vị nhỏ nhất)", render: (_, i) => `${formatNumber(BigInt(i.amount_minor) * BigInt(i.quantity))} ${i.currency}` }, { title: "Thao tác", render: (_, i) => <div className="flex gap-2"><Button disabled={!pending} title="Sửa tính năng bổ sung" aria-label="Sửa tính năng bổ sung" icon={<Pencil size={16} aria-hidden/>} onClick={() => setEdit(i)}/><Popconfirm title="Xóa tính năng bổ sung?" onConfirm={() => { if (!remove.isPending && pending)
                remove.mutate(i.feature_id); }}><Button danger disabled={!pending || remove.isPending} title="Xóa tính năng bổ sung" aria-label="Xóa tính năng bổ sung" icon={<Trash2 size={16} aria-hidden/>}/></Popconfirm></div> }]}/><div className="mt-3 flex justify-end gap-2"><Button disabled={!offset || list.isFetching} onClick={() => setOffset(offset - 20)}>Trước</Button><Button disabled={list.isFetching || list.isError || (list.data?.items.length ?? 0) < 20} onClick={() => setOffset(offset + 20)}>Tiếp</Button></div><Modal title={edit === "create" ? "Thêm tính năng tùy chỉnh" : "Sửa tính năng bổ sung"} open={!!edit && pending} onCancel={() => setEdit(null)} footer={null} destroyOnHidden>{edit && <AddonForm subscription={subscription} item={edit === "create" ? undefined : edit} onSaved={() => setEdit(null)}/>}</Modal></section>;
}
