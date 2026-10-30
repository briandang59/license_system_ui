"use client";

import { useSyncExternalStore } from "react";
import { Alert, Button, Popconfirm, Table } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, FileText, ShieldCheck } from "lucide-react";
import { registrationService } from "./service";
import { formatQuoteMoney } from "./money";
import "./quote-page.css";

const subscribe = (callback: () => void) => {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
};

export default function QuotePage() {
  const token = useSyncExternalStore(subscribe, () => window.location.hash.slice(1), () => "");
  const valid = /^[a-f0-9]{64}$/.test(token);
  const client = useQueryClient();
  // The private token stays in the URL fragment and request body; query data is discarded on unmount.
  const quote = useQuery({ queryKey: ["customer-quote", token], queryFn: ({ signal }) => registrationService.view(token, signal), enabled: valid, gcTime: 0, retry: false });
  const accept = useMutation({ mutationFn: () => registrationService.accept(token), onSuccess: async () => { await client.invalidateQueries({ queryKey: ["customer-quote"] }); } });
  const data = quote.data;
  const period = data && ({ month: "Hàng tháng", year: "Hàng năm", one_time: "Một lần" })[data.billing_interval];

  return <main className="quote-page">
    <div className="quote-container">
      <header className="quote-header">
        <div className="quote-mark" aria-hidden="true"><FileText size={22} /></div>
        <div><p className="quote-brand">License System</p><p className="quote-brandDescription">Thông tin báo giá dịch vụ</p></div>
      </header>
      <div className="quote-intro"><h1>Báo giá dịch vụ</h1><p>Kiểm tra các hạng mục và điều khoản trước khi xác nhận.</p></div>
      {!valid ? <div className="quote-state"><Alert type="info" showIcon title="Mở đường link đầy đủ trong email báo giá để xem thông tin." /></div>
        : quote.isPending ? <div className="quote-state"><p role="status">Đang tải báo giá...</p></div>
        : quote.isError ? <div className="quote-state"><Alert type="error" showIcon title={quote.error.message} action={<Button onClick={() => void quote.refetch()}>Thử lại</Button>} /></div>
        : data && <div className="quote-document">
          <div className="quote-documentHeader">
            <div><span className="quote-label">Báo giá</span><h2>Chi tiết dịch vụ</h2><p>Phiên bản {data.version}</p></div>
            <div className="quote-expiry"><span className="quote-label">Hiệu lực đến</span><strong>{new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "short", timeStyle: "short" }).format(new Date(data.expires_at))}</strong><span>Giờ Việt Nam</span></div>
          </div>
          <section className="quote-items" aria-labelledby="quote-items-title">
            <div className="quote-sectionHeading"><h3 id="quote-items-title">Hạng mục báo giá</h3><span>{data.lines.length} hạng mục</span></div>
            <Table pagination={false} rowKey={(_, index) => String(index)} dataSource={data.lines} scroll={{ x: 600 }} columns={[{ title: "Cấu hình / Hạng mục", dataIndex: "description" }, { title: "Số lượng", dataIndex: "quantity", align: "right" }, { title: "Đơn giá", dataIndex: "unit_amount_minor", align: "right", render: (v: number) => formatQuoteMoney(v, data.currency) }, { title: "Thành tiền", align: "right", render: (_, line) => formatQuoteMoney(line.quantity * line.unit_amount_minor, data.currency) }]} />
          </section>
          <div className="quote-total"><div><span className="quote-label">Tổng cộng</span><p>Chu kỳ thanh toán: {period}</p></div><strong>{formatQuoteMoney(data.total_minor, data.currency)}</strong></div>
          <section className="quote-terms" aria-labelledby="quote-terms-title"><h3 id="quote-terms-title">Điều khoản</h3><p>{data.terms}</p></section>
          <div className="quote-confirmation">
            <div className="quote-confirmationCopy"><ShieldCheck size={22} aria-hidden="true" /><div><h3>Tiếp theo</h3><p>Xác nhận báo giá chưa kích hoạt dịch vụ. Chúng tôi sẽ liên hệ để hướng dẫn thanh toán và triển khai.</p></div></div>
            {data.accepted_at ? <div className="quote-accepted" role="status"><CheckCircle2 size={20} aria-hidden="true" /> Bạn đã xác nhận báo giá</div> : <Popconfirm title="Xác nhận đồng ý với cấu hình, giá và điều khoản trên?" onConfirm={() => accept.mutate()} okText="Xác nhận" cancelText="Xem lại"><Button type="primary" size="large" loading={accept.isPending}>Xác nhận báo giá</Button></Popconfirm>}
          </div>
          {accept.isError && <div className="quote-error"><Alert type="error" showIcon title={accept.error.message} /></div>}
        </div>}
    </div>
  </main>;
}
