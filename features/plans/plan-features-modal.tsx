"use client";

import { useState } from "react";
import { Alert, Button, ConfigProvider, Modal } from "antd";
import { Info, ListPlus, Plus } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import FormSwitch from "@/components/form/form-switch";
import FormInputNumber from "@/components/form/form-input-number";
import FeaturePicker, { type FeatureOption } from "@/features/features/feature-picker";
import { planFeaturesFormSchema, type Plan, type PlanFeaturesForm, type PlanFeatureInput } from "@/features/plans/schema";
import { planService } from "@/features/plans/service";
import { getApiErrorMessage } from "@/lib/api-errors";

export default function PlanFeaturesModal({ plan, onClose }: { plan: Plan; onClose: () => void }) {
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
    onSuccess: async (results, items) => {
      const failedIds = items.filter((_, index) => results[index].status === "rejected").map((item) => item.feature_id);
      const firstError = results.find((result) => result.status === "rejected");
      const added = results.length - failedIds.length;
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
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><ListPlus size={22} aria-hidden="true" /></span>
      <div className="min-w-0">
        <div className="text-lg font-semibold text-slate-900">Add features</div>
        <div className="mt-0.5 text-sm font-normal text-slate-500">Plan <span className="font-medium text-slate-700 wrap-anywhere">{plan.name}</span></div>
      </div>
    </div>} open width={1060} style={{ top: 32 }} footer={null}
      closable={!save.isPending} keyboard={!save.isPending} mask={{ closable: !save.isPending }}
      onCancel={() => { if (!save.isPending) onClose(); }}>
      <p className="mt-4 mb-5 text-sm text-slate-500">Choose features and configure what’s included in this plan.</p>
      {(assigned.isError || save.isError) && <div role="alert" className="mb-4">
        <Alert type="error" title={getApiErrorMessage(save.error ?? assigned.error)}
          action={assigned.isError ? <Button onClick={() => void assigned.refetch()}>Retry</Button> : undefined} />
      </div>}
      {feedback && <div role="status" className="mb-4">
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
          Table: { cellPaddingBlockSM: 12, cellPaddingInlineSM: 12, headerBg: "#f8fafc", borderColor: "#e2e8f0", rowSelectedBg: "#f0f7ff", rowSelectedHoverBg: "#e6f2ff" },
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
            if (index === -1) return <span className="text-xs text-slate-400">Select to configure</span>;
            return <div className="flex items-start gap-4">
              <div className="w-16 shrink-0">
                <FormSwitch control={control} name={`values.${index}.enabled`}
                  label={<>Enabled<span className="sr-only"> for {feature.name}</span></>} disabled={save.isPending} />
              </div>
              {feature.feature_type === "quantity" ? <div className="min-w-0 flex-1">
                <FormInputNumber control={control} name={`values.${index}.limit_value`}
                  label={<>Limit<span className="sr-only"> for {feature.name}</span></>}
                  suffix={feature.unit} min={0} max={Number.MAX_SAFE_INTEGER} placeholder="Not set" disabled={save.isPending} />
              </div> : feature.feature_type === "unlimited" ? <span className="pt-7 text-sm text-slate-500">No limit</span> : null}
            </div>;
          }}
        />
        </ConfigProvider>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-5">
          <p className="flex items-center gap-2 text-xs text-slate-500"><Info size={14} className="shrink-0" aria-hidden="true" />Empty limit = not configured. Zero is a valid limit.</p>
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
