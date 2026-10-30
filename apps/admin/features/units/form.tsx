"use client";
import { App, Button } from "antd";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import FormInput from "@/components/form/form-input";
import FormSelect from "@/components/form/form-select";
import { getApiErrorMessage } from "@/lib/api-errors";
import { unitFormSchema, type Unit, type UnitForm as UnitFormValues } from "@/features/units/schema";
import { unitService } from "@/features/units/service";
export function UnitForm({ unit, onSaved }: {
    unit?: Unit;
    onSaved: () => void;
}) {
    const { message } = App.useApp();
    const queryClient = useQueryClient();
    const { control, handleSubmit } = useForm<UnitFormValues>({
        resolver: zodResolver(unitFormSchema),
        defaultValues: {
            symbol: unit?.symbol ?? "",
            code: unit?.code ?? "",
            name: unit?.name ?? "",
            status: unit?.status ?? "active",
        },
    });
    const save = useMutation({
        mutationFn: (data: UnitFormValues) => {
            const payload = {
                ...data,
                symbol: data.symbol || null,
            };
            return unit ? unitService.update(unit.id, payload) : unitService.create(payload);
        },
        onError: (error) => { void message.error(getApiErrorMessage(error)); },
        onSuccess: async () => {
            void message.success(unit ? "Đã cập nhật đơn vị tính." : "Đã tạo đơn vị tính.");
            await queryClient.invalidateQueries({ queryKey: ["units"] });
            onSaved();
        },
    });
    return (<form noValidate onSubmit={handleSubmit((data) => { if (!save.isPending)
        save.mutate(data); })}>
      <FormInput required control={control} name="code" label="Mã" disabled={save.isPending}/>
      <FormInput required control={control} name="name" label="Tên" disabled={save.isPending}/>
      <FormInput control={control} name="symbol" label="Ký hiệu" disabled={save.isPending}/>
      <FormSelect required control={control} name="status" label="Trạng thái" disabled={save.isPending} options={[{ value: "active", label: "Hoạt động" }, { value: "inactive", label: "Ngừng hoạt động" }]}/>
      <Button htmlType="submit" type="primary" loading={save.isPending} block>
        {unit ? "Lưu thay đổi" : "Tạo đơn vị tính"}
      </Button>
    </form>);
}
