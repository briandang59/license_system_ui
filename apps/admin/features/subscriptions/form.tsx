"use client";
import { useEffect } from "react";
import { App, Button } from "antd";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import FormInput from "@/components/form/form-input";
import FormSwitch from "@/components/form/form-switch";
import CompanySelect from "@/features/companies/company-select";
import PlanSelect from "@/features/plans/plan-select";
import PriceSelect from "@/features/pricing/price-select";
import { getApiErrorMessage } from "@/lib/api-errors";
import { subscriptionInputSchema, type SubscriptionInput } from "./schema";
import { subscriptionService } from "./service";
export default function SubscriptionForm({ onSaved }: {
    onSaved: () => void;
}) {
    const { message } = App.useApp();
    const client = useQueryClient();
    const { control, handleSubmit, setValue } = useForm<SubscriptionInput>({ resolver: zodResolver(subscriptionInputSchema), defaultValues: { start_date: new Date().toISOString(), auto_renew: false } });
    const plan = useWatch({ control, name: "plan_id" });
    const start = useWatch({ control, name: "start_date" });
    useEffect(() => { setValue("price_id", null); }, [plan, start, setValue]);
    const save = useMutation({ mutationFn: subscriptionService.create, onError: e => void message.error(getApiErrorMessage(e)), onSuccess: async () => { void message.success("Đã tạo đăng ký dịch vụ."); await client.invalidateQueries({ queryKey: ["subscriptions"] }); onSaved(); } });
    return <form noValidate onSubmit={handleSubmit(v => { if (!save.isPending)
        save.mutate(v); })}><CompanySelect control={control} name="company_id" label="Doanh nghiệp" disabled={save.isPending}/><PlanSelect control={control} name="plan_id" label="Gói dịch vụ" disabled={save.isPending}/><FormInput control={control} name="start_date" label="Ngày bắt đầu (ISO có múi giờ)" disabled={save.isPending}/><PriceSelect key={`${plan}-${start}`} kind="plans" parent={plan} startDate={start} control={control} name="price_id" label="Giá gói dịch vụ" allowClear disabled={save.isPending}/><p className="mb-4 text-sm text-muted">Hệ thống kiểm tra giá tại ngày bắt đầu. Nếu không chọn giá, đăng ký sẽ chưa có giá và không thể thêm tính năng bổ sung.</p><FormSwitch control={control} name="auto_renew" label="Tự động gia hạn" disabled={save.isPending}/><Button type="primary" htmlType="submit" loading={save.isPending}>Tạo đăng ký dịch vụ</Button></form>;
}
