"use client";
import { useSyncExternalStore } from "react";
import { Alert, Button, Popconfirm, Result, Table } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { registrationService } from "./service";
import { formatQuoteMoney } from "./money";

const subscribe = (callback: () => void) => { window.addEventListener("hashchange", callback); return () => window.removeEventListener("hashchange", callback); };
export default function QuotePage() {
 const token = useSyncExternalStore(subscribe, () => window.location.hash.slice(1), () => "");
 const valid = /^[a-f0-9]{64}$/.test(token); const client = useQueryClient();
 // The private token stays in the URL fragment and request body; query data is discarded on unmount.
 const quote = useQuery({ queryKey: ["customer-quote", token], queryFn: ({ signal }) => registrationService.view(token, signal), enabled: valid, gcTime: 0, retry: false });
 const accept = useMutation({ mutationFn: () => registrationService.accept(token), onSuccess: async () => { await client.invalidateQueries({ queryKey: ["customer-quote"] }); } });
 const data = quote.data;
 return <main style={{ maxWidth: 900, margin: "40px auto", padding: 24 }}><h1>Báo giá dịch vụ</h1>
 {!valid ? <Alert type="info" title="Mở link đầy đủ trong email báo giá để xem thông tin." /> : quote.isPending ? <p role="status">Đang tải báo giá...</p> : quote.isError ? <Alert type="error" title={quote.error.message} action={<Button onClick={() => void quote.refetch()}>Thử lại</Button>} /> : data && <>
 <p>Phiên bản {data.version} · Hiệu lực đến {new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "short", timeStyle: "short" }).format(new Date(data.expires_at))} (giờ Việt Nam)</p>
 <Table pagination={false} rowKey={(_, index) => String(index)} dataSource={data.lines} scroll={{ x: 600 }} columns={[{ title: "Cấu hình / Hạng mục", dataIndex: "description" }, { title: "Số lượng", dataIndex: "quantity" }, { title: "Đơn giá", dataIndex: "unit_amount_minor", render: (v: number) => formatQuoteMoney(v, data.currency) }, { title: "Thành tiền", render: (_, line) => formatQuoteMoney(line.quantity * line.unit_amount_minor, data.currency) }]} />
 <h2>Tổng: {formatQuoteMoney(data.total_minor, data.currency)}</h2>
 <p>Chu kỳ: {({ month: "Hàng tháng", year: "Hàng năm", one_time: "Một lần" })[data.billing_interval]}</p>
 <h2>Điều khoản</h2><p style={{ whiteSpace: "pre-wrap" }}>{data.terms}</p>
 <p>Xác nhận báo giá chưa kích hoạt dịch vụ. Chúng tôi sẽ liên hệ để hướng dẫn thanh toán và triển khai.</p>
 {data.accepted_at ? <Result status="success" title="Bạn đã xác nhận báo giá" /> : <Popconfirm title="Xác nhận đồng ý với cấu hình, giá và điều khoản trên?" onConfirm={() => accept.mutate()} okText="Xác nhận" cancelText="Xem lại"><Button type="primary" loading={accept.isPending}>Xác nhận báo giá</Button></Popconfirm>}
 {accept.isError && <Alert type="error" title={accept.error.message} />}
 </>}
 </main>;
}
