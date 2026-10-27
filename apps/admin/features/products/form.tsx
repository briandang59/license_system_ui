"use client";

import FormInput from "@/components/form/form-input";
import FormSelect from "@/components/form/form-select";
import FormTextarea from "@/components/form/form-textarea";
import { getApiErrorMessage } from "@/lib/api-errors";
import {
  Product,
  ProductInput,
  productInputSchema,
} from "@/features/products/schema";
import { productService } from "@/features/products/service";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { App, Button } from "antd";
import { useForm } from "react-hook-form";

export const ProductForm = ({
  product,
  onSaved,
}: {
  product?: Product;
  onSaved: () => void;
}) => {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const { control, handleSubmit } = useForm<ProductInput>({
    resolver: zodResolver(productInputSchema),
    defaultValues: product
      ? {
          code: product.code,
          name: product.name,
          description: product.description ?? "",
          status: product.status,
        }
      : { code: "", name: "", description: "", status: "active" },
  });
  const save = useMutation({
    mutationFn: (data: ProductInput) =>
      product
        ? productService.update(product.id, {
            name: data.name,
            description: data.description,
            status: data.status,
          })
        : productService.create(data),
    onError: (error) => { void message.error(getApiErrorMessage(error)); },
    onSuccess: async () => {
      void message.success(product ? "Đã cập nhật sản phẩm." : "Đã tạo sản phẩm.");
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      onSaved();
    },
  });
  return (
    <form
      noValidate
      onSubmit={handleSubmit((data) => {
        if (!save.isPending) save.mutate(data);
      })}
    >
      <FormInput
        control={control}
        name="code"
        label="Mã"
        disabled={!!product || save.isPending}
      />
      <FormInput
        control={control}
        name="name"
        label="Tên"
        disabled={save.isPending}
      />
      <FormTextarea
        control={control}
        name="description"
        label="Mô tả"
        disabled={save.isPending}
        rows={3}
      />
      <FormSelect
        control={control}
        name="status"
        label="Trạng thái"
        disabled={save.isPending}
        options={[
          { value: "active", label: "Hoạt động" },
          { value: "inactive", label: "Ngừng hoạt động" },
        ]}
      />
      <Button htmlType="submit" type="primary" loading={save.isPending} block>
        {product ? "Lưu thay đổi" : "Tạo sản phẩm"}
      </Button>
    </form>
  );
};
