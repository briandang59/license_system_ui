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
import ProductSelect from "@/features/products/product-select";
import { getApiErrorMessage } from "@/lib/api-errors";
import { planFormSchema, type Plan, type PlanForm as PlanFormValues } from "@/features/plans/schema";
import { planService } from "@/features/plans/service";

const formSchema = planFormSchema.extend({ prices: priceEntriesSchema });

export function PlanForm({ plan, onSaved, onPendingChange }: { plan?: Plan; onSaved: () => void; onPendingChange?: (pending: boolean) => void }) {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [savedId, setSavedId] = useState(plan?.id);
  const [partial, setPartial] = useState(false);
  const form = useForm<PlanFormValues & { prices: PriceEntry[] }>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prices: [],
      code: plan?.code ?? "",
      name: plan?.name ?? "",
      description: plan?.description ?? "",
      product_id: plan?.product_id,
      status: plan?.status ?? "active",
    },
  });
  const { control, handleSubmit, setValue } = form;
  const save = useMutation({
    mutationFn: ({ prices, ...data }: PlanFormValues & { prices: PriceEntry[] }) => {
      const payload = {
        ...data,
        description: data.description || null,
      };
      setPartial(false);
      return saveWithPrices({ kind: "plans", prices,
        saveParent: () => savedId
          ? planService.update(savedId, { name: payload.name, description: payload.description, status: payload.status })
          : planService.create(payload),
        onParentSaved: id => { setSavedId(id); setPartial(true); },
        onRemaining: remaining => setValue("prices", remaining),
      });
    },
    onError: (error) => { void message.error(getApiErrorMessage(error)); },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["plans"] }),
        queryClient.invalidateQueries({ queryKey: ["prices", "plans"] }),
      ]);
    },
    onSuccess: async () => {
      void message.success(plan ? "Đã cập nhật gói dịch vụ." : "Đã tạo gói dịch vụ.");
      onSaved();
    },
  });
  useEffect(() => {
    onPendingChange?.(save.isPending);
    return () => onPendingChange?.(false);
  }, [save.isPending, onPendingChange]);
  return (<FormProvider {...form}>
    <form noValidate onSubmit={handleSubmit((data) => { if (!save.isPending) save.mutate(data); })}>
      <ProductSelect required control={control} name="product_id" label="Sản phẩm" productId={plan?.product_id} disabled={!!savedId || save.isPending} />
      <FormInput required control={control} name="code" label="Mã" disabled={!!savedId || save.isPending} />
      <FormInput required control={control} name="name" label="Tên" disabled={save.isPending} />
      <FormTextarea control={control} name="description" label="Mô tả" disabled={save.isPending} rows={3} />
      <FormSelect required control={control} name="status" label="Trạng thái" disabled={save.isPending}
        options={[{ value: "active", label: "Hoạt động" }, { value: "inactive", label: "Ngừng hoạt động" }]} />
      <PriceEntryFields disabled={save.isPending} existing={!!savedId} />
      {save.isError && partial && <p role="status" className="mb-4 text-sm text-muted">Thông tin gói đã lưu. Các dòng giá chưa lưu được giữ lại; bấm lưu để thử lại.</p>}
      <Button htmlType="submit" type="primary" loading={save.isPending} block>
        {savedId ? "Lưu thay đổi và giá" : "Tạo gói dịch vụ và lưu giá"}
      </Button>
    </form></FormProvider>
  );
}
