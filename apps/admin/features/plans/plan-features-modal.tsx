"use client";
import DataTransferActions from "@/features/data-transfer/actions";

import { useState } from "react";
import { Alert, App, Button, ConfigProvider, Modal } from "antd";
import { Info, Plus } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import FormSwitch from "@/components/form/form-switch";
import FormInputNumber from "@/components/form/form-input-number";
import UnitLabel from "@/features/units/unit-label";
import FeaturePicker, { type FeatureOption } from "@/features/features/feature-picker";
import { planFeaturesFormSchema, type Plan, type PlanFeaturesForm, type PlanFeatureInput } from "@/features/plans/schema";
import { planService } from "@/features/plans/service";
import { getApiErrorMessage } from "@/lib/api-errors";

export default function PlanFeaturesModal({ plan, onClose }: { plan: Plan; onClose: () => void }) {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<FeatureOption[]>([]);
  const [feedback, setFeedback] = useState<{ added: number; failed: number; message?: string } | null>(null);
  const { control, handleSubmit, getValues, reset } = useForm<PlanFeaturesForm>({
    resolver: zodResolver(planFeaturesFormSchema),
    defaultValues: { values: [] },
  });
  const assigned = useQuery({
    queryKey: ["plans", plan.id, "features"],
    queryFn: ({ signal }) => planService.getFeatures(plan.id, signal),
    staleTime: 0,
  });
  const save = useMutation({
    mutationFn: (items: PlanFeatureInput[]) => planService.addFeatures(plan.id, items),
    onError: (error) => { void message.error(getApiErrorMessage(error)); },
    onSuccess: async (results, items) => {
      const failedIds = items.filter((_, index) => results[index].status === "rejected").map((item) => item.feature_id);
      const firstError = results.find((result) => result.status === "rejected");
      const added = results.length - failedIds.length;
      const summary = `Features: ${added} added, ${failedIds.length} failed.`;
      if (!failedIds.length) void message.success(summary);
      else if (added) void message.warning(summary);
      else void message.error(summary);
      queryClient.setQueryData(["plans", plan.id, "features"], (previous: Awaited<ReturnType<typeof planService.getFeatures>> | undefined) => [
        ...(previous ?? []), ...results.flatMap((result) => result.status === "fulfilled" ? [result.value] : []),
      ]);
      setSelected((current) => current.filter((feature) => failedIds.includes(feature.id)));
      const values = getValues().values;
      reset({ values: values.filter((value) => failedIds.includes(value.feature_id)) });
      setFeedback({ added, failed: failedIds.length, message: firstError ? getApiErrorMessage(firstError.reason) : undefined });
      await queryClient.invalidateQueries({ queryKey: ["plans", plan.id, "features"] });
    },
  });

  return (
    <Modal title={<div className="flex items-center gap-3 pr-7">
      <div className="min-w-0">
        <div className="mb-1 text-sm font-normal text-muted">{plan.name}</div>
        <div className="text-xl font-semibold tracking-tight text-foreground">Configure plan features</div>
      </div>
    </div>} open width={1060} style={{ top: 32 }} footer={null}
      closable={!save.isPending} keyboard={!save.isPending} mask={{ closable: !save.isPending }}
      onCancel={() => { if (!save.isPending) onClose(); }}>
      <p className="mt-3 mb-5 max-w-xl text-sm leading-6 text-muted">Choose what this plan includes. Select a feature to set its availability and usage limit.</p>
      <div className="mb-4"><DataTransferActions resource="plan-features" parentId={plan.id} filters={{plan_id:String(plan.id)}} /></div>
      {assigned.isError && <div role="alert" className="mb-4">
        <Alert type="error" title={getApiErrorMessage(assigned.error)}
          action={assigned.isError ? <Button onClick={() => void assigned.refetch()}>Retry</Button> : undefined} />
      </div>}
      {feedback && feedback.failed > 0 && <div role="status" className="mb-4">
        <Alert type={feedback.failed ? "warning" : "success"}
          title={`${feedback.added} added, ${feedback.failed} failed.`}
          description={feedback.failed ? `${feedback.message} Failed selections are kept. Retry with Add selected.` : undefined} />
      </div>}
      <form noValidate onSubmit={handleSubmit(({ values }) => {
        if (!save.isPending && !assigned.isFetching && !assigned.isError && selected.length) {
          setFeedback(null);
          save.mutate(values);
        }
      })}>
        <ConfigProvider theme={{ components: {
          Form: { itemMarginBottom: 0, verticalLabelPadding: "0 0 4px" },
          Table: { cellPaddingBlockSM: 12, cellPaddingInlineSM: 12 },
        } }}>
        <FeaturePicker productId={plan.product_id} assignedFeatureIds={assigned.data?.map((item) => item.feature_id) ?? []}
          selectedIds={selected.map((feature) => feature.id)}
          disabled={save.isPending || assigned.isPending || assigned.isFetching || assigned.isError}
          onChange={(features) => {
            setFeedback(null);
            const values = getValues().values;
            reset({ values: features.map((feature) => values.find((value) => value.feature_id === feature.id) ?? { feature_id: feature.id, enabled: true, limit_value: null }) });
            setSelected(features);
          }}
          renderConfiguration={(feature) => {
            const index = selected.findIndex((item) => item.id === feature.id);
            if (index === -1) return <span className="text-xs text-muted">Select to configure</span>;
            return <div className="flex items-start gap-4">
              <div className="w-16 shrink-0">
                <FormSwitch control={control} name={`values.${index}.enabled`}
                  label={<>Enabled<span className="sr-only"> for {feature.name}</span></>} disabled={save.isPending} />
              </div>
              {feature.feature_type === "quantity" ? <div className="min-w-0 flex-1">
                <FormInputNumber control={control} name={`values.${index}.limit_value`}
                  label={<>Limit<span className="sr-only"> for {feature.name}</span></>}
                  suffix={<UnitLabel id={feature.unit_id} fallback={feature.unit} />} min={0} max={Number.MAX_SAFE_INTEGER} placeholder="Not set" disabled={save.isPending} />
              </div> : feature.feature_type === "unlimited" ? <span className="pt-7 text-sm text-muted">No limit</span> : null}
            </div>;
          }}
        />
        </ConfigProvider>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
          <p className="flex items-center gap-2 text-xs text-muted"><Info size={14} className="shrink-0" aria-hidden="true" />Leave the limit empty to configure it later. Zero is allowed.</p>
          <div className="ml-auto flex gap-2">
          <Button disabled={save.isPending} onClick={onClose}>Cancel</Button>
          <Button type="primary" htmlType="submit" icon={<Plus size={16} aria-hidden="true" />} loading={save.isPending}
            disabled={!selected.length || assigned.isFetching || assigned.isPending || assigned.isError}>
            Add selected ({selected.length})
          </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
