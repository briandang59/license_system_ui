"use client";

import { App, Button } from "antd";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import FormInput from "@/components/form/form-input";
import FormSelect from "@/components/form/form-select";
import { getApiErrorMessage } from "@/lib/api-errors";
import { companyFormSchema, type Company, type CompanyForm as CompanyFormValues } from "@/features/companies/schema";
import { companyService } from "@/features/companies/service";

export function CompanyForm({ company, onSaved }: { company?: Company; onSaved: () => void }) {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const { control, handleSubmit } = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      code: company?.code ?? "",
      name: company?.name ?? "",
      tax_code: company?.tax_code ?? "",
      email: company?.email ?? "",
      phone: company?.phone ?? "",
      status: company?.status ?? "active",
    },
  });
  const save = useMutation({
    mutationFn: (data: CompanyFormValues) => {
      const payload = {
        ...data,
        tax_code: data.tax_code || null,
        email: data.email || null,
        phone: data.phone || null,
      };
      return company ? companyService.update(company.id, payload) : companyService.create(payload);
    },
    onError: (error) => { void message.error(getApiErrorMessage(error)); },
    onSuccess: async () => {
      void message.success(company ? "Đã cập nhật doanh nghiệp." : "Đã tạo doanh nghiệp.");
      await queryClient.invalidateQueries({ queryKey: ["companies"] });
      onSaved();
    },
  });
  return (
    <form noValidate onSubmit={handleSubmit((data) => { if (!save.isPending) save.mutate(data); })}>
      <FormInput required control={control} name="code" label="Mã" disabled={save.isPending} />
      <FormInput required control={control} name="name" label="Tên" disabled={save.isPending} />
      <FormInput control={control} name="tax_code" label="Mã số thuế" disabled={save.isPending} />
      <FormInput control={control} name="email" label="Email" disabled={save.isPending} />
      <FormInput control={control} name="phone" label="Số điện thoại" disabled={save.isPending} />
      <FormSelect required control={control} name="status" label="Trạng thái" disabled={save.isPending}
        options={[{ value: "active", label: "Hoạt động" }, { value: "inactive", label: "Ngừng hoạt động" }]} />
      <Button htmlType="submit" type="primary" loading={save.isPending} block>
        {company ? "Lưu thay đổi" : "Tạo doanh nghiệp"}
      </Button>
    </form>
  );
}
