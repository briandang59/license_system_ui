"use client";

import { App, Button } from "antd";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import FormInput from "@/components/form/form-input";
import FormSelect from "@/components/form/form-select";
import FormTextarea from "@/components/form/form-textarea";
import UnitSelect from "@/features/units/unit-select";
import ProductSelect from "@/features/products/product-select";
import { getApiErrorMessage } from "@/lib/api-errors";
import { featureFormSchema, type Feature, type FeatureForm as FeatureFormValues } from "@/features/features/schema";
import { featureService } from "@/features/features/service";

export function FeatureForm({ feature, onSaved }: { feature?: Feature; onSaved: () => void }) {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const { control, handleSubmit } = useForm<FeatureFormValues>({
    resolver: zodResolver(featureFormSchema),
    defaultValues: {
      code: feature?.code ?? "",
      name: feature?.name ?? "",
      description: feature?.description ?? "",
      unit: feature?.unit ?? "",
      unit_id: feature?.unit_id ?? undefined,
      product_id: feature?.product_id,
      feature_type: feature?.feature_type ?? "boolean",
      status: feature?.status ?? "active",
    },
  });
  const save = useMutation({
    mutationFn: (data: FeatureFormValues) => {
      const payload = {
        product_id: data.product_id,
        code: data.code,
        name: data.name,
        feature_type: data.feature_type,
        status: data.status,
        description: data.description || null,
        unit_id: data.unit_id ?? null,
      };
      return feature ? featureService.update(feature.id, payload) : featureService.create(payload);
    },
    onError: (error) => { void message.error(getApiErrorMessage(error)); },
    onSuccess: async () => {
      void message.success(feature ? "Đã cập nhật tính năng." : "Đã tạo tính năng.");
      await queryClient.invalidateQueries({ queryKey: ["features"] });
      onSaved();
    },
  });
  return (
    <form noValidate onSubmit={handleSubmit((data) => { if (!save.isPending) save.mutate(data); })}>
      <ProductSelect control={control} name="product_id" label="Sản phẩm" productId={feature?.product_id} disabled={save.isPending} />
      <FormInput control={control} name="code" label="Mã" disabled={save.isPending} />
      <FormInput control={control} name="name" label="Tên" disabled={save.isPending} />
      <FormTextarea control={control} name="description" label="Mô tả" disabled={save.isPending} rows={3} />
      <UnitSelect control={control} name="unit_id" label="Đơn vị tính" unitId={feature?.unit_id ?? undefined} allowClear disabled={save.isPending} />
      <FormSelect control={control} name="feature_type" label="Loại tính năng" disabled={save.isPending}
        options={[{ value: "boolean", label: "Bật/tắt" }, { value: "quantity", label: "Số lượng" }, { value: "unlimited", label: "Không giới hạn" }]} />
      <FormSelect control={control} name="status" label="Trạng thái" disabled={save.isPending}
        options={[{ value: "active", label: "Hoạt động" }, { value: "inactive", label: "Ngừng hoạt động" }]} />
      <Button htmlType="submit" type="primary" loading={save.isPending} block>
        {feature ? "Lưu thay đổi" : "Tạo tính năng"}
      </Button>
    </form>
  );
}
