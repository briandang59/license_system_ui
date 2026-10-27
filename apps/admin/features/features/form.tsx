"use client";

import { App, Button } from "antd";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FormProvider, useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import PriceEntryFields, { priceEntriesSchema, saveWithPrices, type PriceEntry } from "@/features/pricing/price-entry";
import FormInput from "@/components/form/form-input";
import FormSelect from "@/components/form/form-select";
import FormTextarea from "@/components/form/form-textarea";
import UnitSelect from "@/features/units/unit-select";
import ProductSelect from "@/features/products/product-select";
import { getApiErrorMessage } from "@/lib/api-errors";
import { featureFormSchema, type Feature, type FeatureForm as FeatureFormValues } from "@/features/features/schema";
import { featureService } from "@/features/features/service";

const formSchema = featureFormSchema.extend({ prices: priceEntriesSchema });

export function FeatureForm({ feature, onSaved, onPendingChange }: { feature?: Feature; onSaved: () => void; onPendingChange?: (pending: boolean) => void }) {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [savedId, setSavedId] = useState(feature?.id);
  const [partial, setPartial] = useState(false);
  const form = useForm<FeatureFormValues & { prices: PriceEntry[] }>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prices: [],
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
  const { control, handleSubmit, setValue } = form;
  const save = useMutation({
    mutationFn: ({ prices, ...data }: FeatureFormValues & { prices: PriceEntry[] }) => {
      const payload = {
        product_id: data.product_id,
        code: data.code,
        name: data.name,
        feature_type: data.feature_type,
        status: data.status,
        description: data.description || null,
        unit_id: data.unit_id ?? null,
      };
      setPartial(false);
      return saveWithPrices({ kind: "features", prices,
        saveParent: () => savedId ? featureService.update(savedId, payload) : featureService.create(payload),
        onParentSaved: id => { setSavedId(id); setPartial(true); },
        onRemaining: remaining => setValue("prices", remaining),
      });
    },
    onError: (error) => { void message.error(getApiErrorMessage(error)); },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["features"] }),
        queryClient.invalidateQueries({ queryKey: ["prices", "features"] }),
      ]);
    },
    onSuccess: async () => {
      void message.success(feature ? "Đã cập nhật tính năng." : "Đã tạo tính năng.");
      onSaved();
    },
  });
  useEffect(() => {
    onPendingChange?.(save.isPending);
    return () => onPendingChange?.(false);
  }, [save.isPending, onPendingChange]);
  return (<FormProvider {...form}>
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
      <PriceEntryFields disabled={save.isPending} existing={!!savedId} />
      {save.isError && partial && <p role="status" className="mb-4 text-sm text-muted">Thông tin tính năng đã lưu. Các dòng giá chưa lưu được giữ lại; bấm lưu để thử lại.</p>}
      <Button htmlType="submit" type="primary" loading={save.isPending} block>
        {savedId ? "Lưu thay đổi và giá" : "Tạo tính năng và lưu giá"}
      </Button>
    </form></FormProvider>
  );
}
