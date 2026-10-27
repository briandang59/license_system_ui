"use client";

import { useState } from "react";
import { App, Button, Modal } from "antd";
import { Pencil } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import FormInputNumber from "@/components/form/form-input-number";
import FormSwitch from "@/components/form/form-switch";
import UnitLabel from "@/features/units/unit-label";
import { getApiErrorMessage } from "@/lib/api-errors";
import { planFeatureEditSchema, type Plan, type PlanFeatureEdit } from "./schema";
import { planService } from "./service";

type Props = { planId: number; feature: NonNullable<Plan["features"]>[number] };

function EditModal({ planId, feature, onClose }: Props & { onClose: () => void }) {
  const { message } = App.useApp();
  const client = useQueryClient();
  const { control, handleSubmit } = useForm<PlanFeatureEdit>({
    resolver: zodResolver(planFeatureEditSchema),
    defaultValues: { enabled: feature.enabled, limit_value: feature.limit_value },
  });
  const save = useMutation({
    mutationFn: (values: PlanFeatureEdit) => planService.updateFeature(planId, feature.feature_id, {
      enabled: values.enabled,
      ...(feature.feature_type === "quantity" ? { limit_value: values.limit_value } : {}),
    }),
    onError: error => { void message.error(getApiErrorMessage(error)); },
    onSuccess: async () => {
      void message.success("Đã cập nhật tính năng trong gói.");
      await client.invalidateQueries({ queryKey: ["plans"] });
      onClose();
    },
  });
  return <Modal open title={`Sửa ${feature.name}`} footer={null}
    closable={!save.isPending} keyboard={!save.isPending} mask={{ closable: !save.isPending }}
    onCancel={() => { if (!save.isPending) onClose(); }}>
    <form noValidate onSubmit={handleSubmit(values => { if (!save.isPending) save.mutate(values); })}>
      <FormSwitch control={control} name="enabled" label="Bật" disabled={save.isPending} />
      {feature.feature_type === "quantity" ? <>
        <FormInputNumber control={control} name="limit_value" label="Hạn mức" min={0}
          max={Number.MAX_SAFE_INTEGER} placeholder="Chưa cấu hình" disabled={save.isPending}
          suffix={<UnitLabel id={feature.unit_id} fallback={feature.unit} />} />
        <p className="mb-4 text-sm text-muted">Để trống nếu chưa cấu hình hạn mức. Nhập 0 nghĩa là hạn mức bằng 0.</p>
      </> : <p className="mb-4 text-sm text-muted">{feature.feature_type === "unlimited" ? "Tính năng này không giới hạn sử dụng." : "Tính năng này chỉ có trạng thái bật hoặc tắt."}</p>}
      <div className="flex justify-end gap-2">
        <Button disabled={save.isPending} onClick={onClose}>Hủy</Button>
        <Button type="primary" htmlType="submit" loading={save.isPending}>Lưu thay đổi</Button>
      </div>
    </form>
  </Modal>;
}

export default function PlanFeatureEditor({ planId, feature }: Props) {
  const [open, setOpen] = useState(false);
  return <>
    <Button size="small" icon={<Pencil size={16} aria-hidden="true" />}
      aria-label={`Sửa ${feature.name} trong gói`} title="Sửa tính năng trong gói" onClick={() => setOpen(true)} />
    {open && <EditModal planId={planId} feature={feature} onClose={() => setOpen(false)} />}
  </>;
}
