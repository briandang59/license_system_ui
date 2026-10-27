"use client";
import { useRef, useState } from "react";
import { Alert, Button, Modal, Result, Space } from "antd";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Field } from "./fields";
import { registrationInputSchema, type RegistrationInput } from "./schema";
import { registrationService } from "./service";

export type RegistrationSelection = {
 product: { id: number; name: string };
 plans: { id: number; name: string; priceID: number | null }[];
 features: { id: number; name: string; type: string }[];
 planID: number | null;
};
export default function RegistrationDialog({ selection, onClose }: { selection: RegistrationSelection; onClose: () => void }) {
 const [receipt, setReceipt] = useState("");
 const submitted = useRef<{ body: string; key: string } | null>(null);
 const { control, handleSubmit, formState: { errors } } = useForm<RegistrationInput>({ resolver: zodResolver(registrationInputSchema), defaultValues: { request_key: "00000000-0000-4000-8000-000000000000", company_name: "", contact_name: "", email: "", phone: "", tax_code: "", address: "", note: "", product_id: selection.product.id, plan_id: selection.planID, plan_price_id: null, features: [] } });
 const features = useFieldArray({ control, name: "features" });
 const save = useMutation({ mutationFn: registrationService.create, onSuccess: data => setReceipt(data.reference) });
 return <Modal open onCancel={() => { if (!save.isPending) onClose(); }} footer={null} width={860} title={`Đăng ký ${selection.product.name}`} maskClosable={!save.isPending} closable={!save.isPending}>
 {receipt ? <Result status="success" title="Đã tiếp nhận yêu cầu" subTitle={`Mã yêu cầu: ${receipt}. Email xác nhận sẽ được gửi đến địa chỉ bạn cung cấp. Chúng tôi sẽ kiểm tra cấu hình và gửi báo giá.`} extra={<Button onClick={onClose}>Đóng</Button>} /> : <form noValidate onSubmit={event => void handleSubmit(values => {
  if (save.isPending) return;
  const input = { ...values, plan_price_id: selection.plans.find(p => p.id === values.plan_id)?.priceID ?? null };
  const body = JSON.stringify({ ...input, request_key: undefined });
  if (submitted.current?.body !== body) submitted.current = { body, key: crypto.randomUUID() };
  save.mutate({ ...input, request_key: submitted.current.key });
 })(event)}>
 <p>Chọn cấu hình mong muốn. Hệ thống sẽ gửi báo giá để bạn xác nhận trước khi triển khai.</p>
 <fieldset disabled={save.isPending} style={{ border: 0, padding: 0 }}>
 <h3>Nhu cầu sử dụng</h3>
 <Field control={control} name="plan_id" label="Gói nền (bỏ trống để tùy chỉnh hoàn toàn)" kind="select" options={selection.plans.map(p => ({ value: p.id, label: p.name }))} disabled={save.isPending} />
 <p>Các tính năng dưới đây là yêu cầu bổ sung/điều chỉnh. Admin sẽ xác nhận hạn mức và giá trong báo giá cuối cùng.</p>
 {features.fields.map((row, i) => {
  const feature = selection.features.find(f => f.id === row.feature_id);
  return <div key={row.id} style={{ borderBottom: "1px solid var(--line)", paddingBlock: 12 }}><strong>{feature?.name}</strong><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16 }}>
   <Field control={control} name={`features.${i}.quantity`} label="Số lượng mua" kind="number" disabled={save.isPending} />
   {feature?.type === "quantity" && <Field control={control} name={`features.${i}.limit_value`} label="Hạn mức mong muốn" kind="number" disabled={save.isPending} />}
  </div><Button onClick={() => features.remove(i)} disabled={save.isPending} aria-label={`Bỏ ${feature?.name}`}>Bỏ tính năng</Button></div>;
 })}
 <Space wrap style={{ marginBlock: 16 }}>{selection.features.filter(f => !features.fields.some(row => row.feature_id === f.id)).map(f => <Button key={f.id} disabled={save.isPending || features.fields.length >= 100} onClick={() => features.append({ feature_id: f.id, quantity: 1, limit_value: null })}>Thêm {f.name}</Button>)}</Space>
 <h3>Thông tin công ty</h3><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: "0 20px" }}>
 <Field control={control} name="company_name" label="Tên công ty" disabled={save.isPending} />
 <Field control={control} name="tax_code" label="Mã số thuế (không bắt buộc)" disabled={save.isPending} />
 <Field control={control} name="contact_name" label="Người liên hệ" disabled={save.isPending} />
 <Field control={control} name="email" label="Email nhận xác nhận và báo giá" kind="email" disabled={save.isPending} />
 <Field control={control} name="phone" label="Điện thoại" disabled={save.isPending} />
 <Field control={control} name="address" label="Địa chỉ (không bắt buộc)" disabled={save.isPending} />
 </div><Field control={control} name="note" label="Yêu cầu triển khai / tính năng khác (không bắt buộc)" kind="textarea" disabled={save.isPending} />
 </fieldset>
 {errors.features?.root?.message && <Alert type="error" title={errors.features.root.message} />}
 {save.isError && <Alert type="error" showIcon title={save.error.message} style={{ marginBottom: 16 }} />}
 <p>Gửi yêu cầu đồng nghĩa bạn đồng ý để chúng tôi liên hệ về cấu hình và báo giá này. Dịch vụ chưa được kích hoạt.</p>
 <Button type="primary" htmlType="submit" loading={save.isPending}>Gửi yêu cầu đăng ký</Button>
 </form>}
 </Modal>;
}
