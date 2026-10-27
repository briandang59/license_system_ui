"use client";

import { App, Button } from "antd";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import FormInput from "@/components/form/form-input";
import FormSelect from "@/components/form/form-select";
import FormTextarea from "@/components/form/form-textarea";
import ProductSelect from "@/features/products/product-select";
import { getApiErrorMessage } from "@/lib/api-errors";
import { planFormSchema, type Plan, type PlanForm as PlanFormValues } from "@/features/plans/schema";
import { planService } from "@/features/plans/service";

export function PlanForm({ plan, onSaved }: { plan?: Plan; onSaved: () => void }) {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const { control, handleSubmit } = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      code: plan?.code ?? "",
      name: plan?.name ?? "",
      description: plan?.description ?? "",
      product_id: plan?.product_id,
      status: plan?.status ?? "active",
    },
  });
  const save = useMutation({
    mutationFn: (data: PlanFormValues) => {
      const payload = {
        ...data,
        description: data.description || null,
      };
      return plan
        ? planService.update(plan.id, { name: payload.name, description: payload.description, status: payload.status })
        : planService.create(payload);
    },
    onError: (error) => { void message.error(getApiErrorMessage(error)); },
    onSuccess: async () => {
      void message.success(plan ? "Đã cập nhật gói dịch vụ." : "Đã tạo gói dịch vụ.");
      await queryClient.invalidateQueries({ queryKey: ["plans"] });
      onSaved();
    },
  });
  return (
    <form noValidate onSubmit={handleSubmit((data) => { if (!save.isPending) save.mutate(data); })}>
      <ProductSelect control={control} name="product_id" label="Sản phẩm" productId={plan?.product_id} disabled={!!plan || save.isPending} />
      <FormInput control={control} name="code" label="Mã" disabled={!!plan || save.isPending} />
      <FormInput control={control} name="name" label="Tên" disabled={save.isPending} />
      <FormTextarea control={control} name="description" label="Mô tả" disabled={save.isPending} rows={3} />
      <FormSelect control={control} name="status" label="Trạng thái" disabled={save.isPending}
        options={[{ value: "active", label: "Hoạt động" }, { value: "inactive", label: "Ngừng hoạt động" }]} />
      <Button htmlType="submit" type="primary" loading={save.isPending} block>
        {plan ? "Lưu thay đổi" : "Tạo gói dịch vụ"}
      </Button>
    </form>
  );
}
