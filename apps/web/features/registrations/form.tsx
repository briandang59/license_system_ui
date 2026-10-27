"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { Alert, App, Button, Result } from "antd";
import { ArrowLeft, Check, Plus, Trash2 } from "lucide-react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
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
  priceUnavailable: boolean;
};

export default function RegistrationForm({ selection }: { selection: RegistrationSelection }) {
  const { message } = App.useApp();
  const [receipt, setReceipt] = useState("");
  const submitted = useRef<{ body: string; key: string } | null>(null);
  const { control, handleSubmit, formState: { errors } } = useForm<RegistrationInput>({ resolver: zodResolver(registrationInputSchema), defaultValues: { request_key: "00000000-0000-4000-8000-000000000000", company_name: "", contact_name: "", email: "", phone: "", tax_code: "", address: "", note: "", product_id: selection.product.id, plan_id: selection.planID, plan_price_id: null, features: [] } });
  const features = useFieldArray({ control, name: "features" });
  const selectedPlan = useWatch({ control, name: "plan_id" });
  const save = useMutation({
    mutationFn: registrationService.create,
    onSuccess: data => { setReceipt(data.reference); void message.success("Đã gửi yêu cầu đăng ký."); },
    onError: () => { void message.error("Không thể gửi yêu cầu. Vui lòng thử lại hoặc liên hệ hỗ trợ."); },
  });
  const planName = selection.plans.find(plan => plan.id === selectedPlan)?.name ?? "Gói tùy chỉnh";

  return <main className="registration-page"><div className="registration-wrap">
    <Link className="registration-back" href="/#pricing"><ArrowLeft size={16} aria-hidden /> Quay lại bảng giá</Link>
    {receipt ? <div className="registration-success"><Result status="success" title="Đã tiếp nhận yêu cầu" subTitle={`Mã yêu cầu: ${receipt}. Email xác nhận sẽ được gửi đến địa chỉ bạn cung cấp. Chúng tôi sẽ kiểm tra cấu hình và gửi báo giá.`} extra={<Link className="registration-home-link" href="/#pricing">Về bảng giá</Link>} /></div> : <>
      <header className="registration-heading"><p>Đăng ký dịch vụ</p><h1>Cho chúng tôi biết<br />điều bạn cần.</h1><span>Chọn cấu hình phù hợp và để lại thông tin liên hệ. Chúng tôi sẽ gửi báo giá để bạn xem trước khi triển khai.</span></header>
      {selection.priceUnavailable && <Alert type="warning" showIcon title="Chưa tải được giá hiện tại" description="Bạn vẫn có thể gửi yêu cầu; giá sẽ được xác nhận trong báo giá." className="registration-alert" />}
      <form noValidate onSubmit={event => void handleSubmit(values => {
        if (save.isPending) return;
        const input = { ...values, plan_price_id: selection.plans.find(plan => plan.id === values.plan_id)?.priceID ?? null };
        const body = JSON.stringify({ ...input, request_key: undefined });
        if (submitted.current?.body !== body) submitted.current = { body, key: crypto.randomUUID() };
        save.mutate({ ...input, request_key: submitted.current.key });
      }, () => { void message.error("Vui lòng kiểm tra các thông tin chưa hợp lệ."); })(event)}>
        <div className="registration-layout"><div className="registration-main">
          <section className="registration-section" aria-labelledby="needs-title"><div className="registration-section-heading"><span>01</span><div><h2 id="needs-title">Cấu hình mong muốn</h2><p>Chọn gói nền và bổ sung tính năng theo nhu cầu.</p></div></div>
            <Field control={control} name="plan_id" label="Gói nền (có thể để trống)" kind="select" options={selection.plans.map(plan => ({ value: plan.id, label: plan.name }))} disabled={save.isPending} />
            <div className="registration-feature-heading"><div><h3>Tính năng bổ sung</h3><p>Chọn tính năng cần thêm hoặc điều chỉnh hạn mức.</p></div><span>{features.fields.length} đã chọn</span></div>
            {features.fields.length > 0 && <div className="registration-selected">{features.fields.map((row, index) => {
              const feature = selection.features.find(item => item.id === row.feature_id);
              return <div className="registration-feature" key={row.id}><div className="registration-feature-top"><strong><Check size={16} aria-hidden /> {feature?.name}</strong><Button type="text" icon={<Trash2 size={16} aria-hidden />} onClick={() => features.remove(index)} disabled={save.isPending} aria-label={`Bỏ ${feature?.name}`} /></div><div className="registration-fields-grid">
                <Field control={control} name={`features.${index}.quantity`} label="Số lượng mua" kind="number" disabled={save.isPending} />
                {feature?.type === "quantity" && <Field control={control} name={`features.${index}.limit_value`} label="Hạn mức mong muốn" kind="number" disabled={save.isPending} />}
              </div></div>;
            })}</div>}
            {selection.features.length ? <div className="registration-feature-list">{selection.features.filter(feature => !features.fields.some(row => row.feature_id === feature.id)).map(feature => <button className="registration-add" type="button" key={feature.id} disabled={save.isPending || features.fields.length >= 100} onClick={() => features.append({ feature_id: feature.id, quantity: 1, limit_value: null })}><Plus size={16} aria-hidden /> {feature.name}</button>)}</div> : <p className="registration-hint">Chưa có tính năng bổ sung trong danh mục. Bạn có thể mô tả nhu cầu ở phần ghi chú.</p>}
            {errors.features?.root?.message && <Alert type="error" title={errors.features.root.message} />}
          </section>
          <section className="registration-section" aria-labelledby="company-title"><div className="registration-section-heading"><span>02</span><div><h2 id="company-title">Thông tin công ty</h2><p>Chúng tôi sẽ liên hệ và gửi báo giá qua email này.</p></div></div>
            <div className="registration-fields-grid"><Field control={control} name="company_name" label="Tên công ty" disabled={save.isPending} /><Field control={control} name="tax_code" label="Mã số thuế (không bắt buộc)" disabled={save.isPending} /><Field control={control} name="contact_name" label="Người liên hệ" disabled={save.isPending} /><Field control={control} name="email" label="Email nhận báo giá" kind="email" disabled={save.isPending} /><Field control={control} name="phone" label="Điện thoại" disabled={save.isPending} /><Field control={control} name="address" label="Địa chỉ (không bắt buộc)" disabled={save.isPending} /></div>
            <Field control={control} name="note" label="Yêu cầu triển khai hoặc tính năng khác (không bắt buộc)" kind="textarea" disabled={save.isPending} />
          </section>
        </div><aside className="registration-summary" aria-label="Tóm tắt yêu cầu"><h2>Tóm tắt yêu cầu</h2><div className="registration-summary-row"><span>Sản phẩm</span><strong>{selection.product.name}</strong></div><div className="registration-summary-row"><span>Gói nền</span><strong>{planName}</strong></div><div className="registration-summary-row"><span>Tính năng bổ sung</span><strong>{features.fields.length}</strong></div><p>Giá và cấu hình cuối cùng sẽ được xác nhận trong báo giá gửi qua email.</p><div className="registration-summary-note">Gửi yêu cầu chưa kích hoạt dịch vụ. Bạn có thể xem và xác nhận báo giá trước khi triển khai.</div></aside></div>
        <div className="registration-submit"><p>Khi gửi, bạn đồng ý để chúng tôi liên hệ về yêu cầu này.</p><Button type="primary" htmlType="submit" size="large" loading={save.isPending}>Gửi yêu cầu đăng ký</Button></div>
      </form>
    </>}
  </div></main>;
}
