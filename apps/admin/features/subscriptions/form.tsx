"use client";
import { useEffect } from "react";
import { App, Button } from "antd";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import FormDatePicker from "@/components/form/form-date-picker";
import { z } from "zod";
import type { Dayjs } from "dayjs";
import { vietnamNow, isValidDateTime } from "@/utils/functions/formatDateTime";
import FormSwitch from "@/components/form/form-switch";
import CompanySelect from "@/features/companies/company-select";
import PlanSelect from "@/features/plans/plan-select";
import PriceSelect from "@/features/pricing/price-select";
import { getApiErrorMessage } from "@/lib/api-errors";
import { subscriptionInputSchema } from "./schema";
import { subscriptionService } from "./service";
const formSchema = z.object({ ...subscriptionInputSchema.shape, start_date: z.custom<Dayjs>(isValidDateTime, "Chọn ngày bắt đầu hợp lệ.") }).refine(value => !value.end_date || Date.parse(value.end_date) > value.start_date.valueOf(), { path: ["end_date"], message: "Ngày kết thúc phải sau ngày bắt đầu." });

export default function SubscriptionForm({ onSaved }: {
    onSaved: () => void;
}) {
    const { message } = App.useApp();
    const client = useQueryClient();
    const { control, handleSubmit, setValue } = useForm<z.infer<typeof formSchema>>({ resolver: zodResolver(formSchema), defaultValues: { start_date: vietnamNow(), auto_renew: false } });
    const plan = useWatch({ control, name: "plan_id" });
    const start = useWatch({ control, name: "start_date" });
    useEffect(() => { setValue("price_id", null); }, [plan, start, setValue]);
    const save = useMutation({ mutationFn: (values: z.infer<typeof formSchema>) => subscriptionService.create({ ...values, start_date: values.start_date.toISOString() }), onError: e => void message.error(getApiErrorMessage(e)), onSuccess: async () => { void message.success("Đã tạo đăng ký dịch vụ."); await client.invalidateQueries({ queryKey: ["subscriptions"] }); onSaved(); } });
    return <form noValidate onSubmit={handleSubmit(v => { if (!save.isPending)
        save.mutate(v); })}><CompanySelect required control={control} name="company_id" label="Doanh nghiệp" disabled={save.isPending}/><PlanSelect required control={control} name="plan_id" label="Gói dịch vụ" disabled={save.isPending}/><FormDatePicker required control={control} name="start_date" label="Ngày bắt đầu (giờ Việt Nam)" showTime disabled={save.isPending}/><PriceSelect key={`${plan}-${start?.valueOf()}`} kind="plans" parent={plan} startDate={isValidDateTime(start) ? start.toISOString() : ""} control={control} name="price_id" label="Giá gói dịch vụ" allowClear disabled={save.isPending}/><p className="mb-4 text-sm text-muted">Hệ thống kiểm tra giá tại ngày bắt đầu. Nếu không chọn giá, đăng ký sẽ chưa có giá và không thể thêm tính năng bổ sung.</p><FormSwitch control={control} name="auto_renew" label="Tự động gia hạn" disabled={save.isPending}/><Button type="primary" htmlType="submit" loading={save.isPending}>Tạo đăng ký dịch vụ</Button></form>;
}
