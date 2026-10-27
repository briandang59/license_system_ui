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
    const save = useMutation({ mutationFn: subscriptionService.create, onError: e => void message.error(getApiErrorMessage(e)), onSuccess: async () => { void message.success("Subscription created."); await client.invalidateQueries({ queryKey: ["subscriptions"] }); onSaved(); } });
    return <form noValidate onSubmit={handleSubmit(v => { if (!save.isPending)
        save.mutate(v); })}><CompanySelect control={control} name="company_id" label="Company" disabled={save.isPending}/><PlanSelect control={control} name="plan_id" label="Plan" disabled={save.isPending}/><FormInput control={control} name="start_date" label="Start date (ISO with timezone)" disabled={save.isPending}/><PriceSelect key={`${plan}-${start}`} kind="plans" parent={plan} startDate={start} control={control} name="price_id" label="Plan price" allowClear disabled={save.isPending}/><p className="mb-4 text-sm text-muted">The server validates the selected price at the start date. Without a price this record is unpriced and cannot receive add-ons.</p><FormSwitch control={control} name="auto_renew" label="Auto renew" disabled={save.isPending}/><Button type="primary" htmlType="submit" loading={save.isPending}>Create subscription</Button></form>;
}
