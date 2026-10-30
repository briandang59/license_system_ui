"use client";
import { useState } from "react";
import { Alert, Button, Descriptions, Modal, Space, Table, Tag } from "antd";
import { Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getApiErrorMessage } from "@/lib/api-errors";
import { formatDateTime } from "@/utils/functions/formatDateTime";
import { registrationService } from "./service";
import QuoteForm from "./quote-form";
import type { Registration } from "./schema";
const labels = { pending: "Chờ xử lý", quoted: "Đã lập báo giá", accepted: "Đã xác nhận" };
export default function RegistrationsPage() {
 const [offset, setOffset] = useState(0); const [selected, setSelected] = useState<number | null>(null);
 const list = useQuery({ queryKey: ["registrations", offset], queryFn: ({ signal }) => registrationService.list(offset, signal) });
 const detail = useQuery({ queryKey: ["registrations", "detail", selected], queryFn: ({ signal }) => registrationService.detail(selected!, signal), enabled: selected !== null, refetchInterval: selected === null ? false : 15000 });
 const r = detail.data;
 return <><h1 className="mb-4 text-2xl font-semibold">Yêu cầu & báo giá</h1><p className="mb-6 text-muted">Tiếp nhận đăng ký, cấu hình gói custom và gửi báo giá cho doanh nghiệp.</p>
 {list.isError && <Alert type="error" title={getApiErrorMessage(list.error)} action={<Button onClick={() => void list.refetch()}>Thử lại</Button>} />}
 <Table<Registration> loading={list.isPending} rowKey="id" dataSource={list.data?.items ?? []} pagination={false} scroll={{ x: 750 }} columns={[{ title: "#", render: (_, __, i) => offset + i + 1 }, { title: "Mã yêu cầu", dataIndex: "reference" }, { title: "Công ty", dataIndex: "company_name" }, { title: "Liên hệ", render: (_, row) => <>{row.contact_name}<br />{row.email}</> }, { title: "Trạng thái", render: (_, row) => <Tag>{labels[row.status]}</Tag> }, { title: "Ngày đăng ký", render: (_, row) => formatDateTime(row.created_at) }, { title: "Thao tác", render: (_, row) => <Button icon={<Eye size={16} aria-hidden />} aria-label={`Xem yêu cầu ${row.reference}`} title="Xem và lập báo giá" onClick={() => setSelected(row.id)} /> }]} />
 <Space className="mt-4"><Button disabled={offset === 0 || list.isFetching} onClick={() => setOffset(v => v - 20)}>Trang trước</Button><Button disabled={!list.data || list.data.items.length < 20 || list.isFetching} onClick={() => setOffset(v => v + 20)}>Trang sau</Button><Button onClick={() => void list.refetch()}>Tải lại</Button></Space>
 <Modal open={selected !== null} title="Chi tiết yêu cầu và báo giá" footer={null} width={1000} onCancel={() => setSelected(null)}>
 {detail.isPending ? <p role="status">Đang tải...</p> : detail.isError ? <Alert type="error" title={getApiErrorMessage(detail.error)} action={<Button onClick={() => void detail.refetch()}>Thử lại</Button>} /> : r && <>
 <Descriptions column={{ xs: 1, sm: 2 }} items={[{ key: "reference", label: "Mã yêu cầu", children: r.reference }, { key: "company", label: "Công ty", children: r.company_name }, { key: "tax", label: "Mã số thuế", children: r.tax_code || "—" }, { key: "contact", label: "Người liên hệ", children: r.contact_name }, { key: "email", label: "Email", children: r.email }, { key: "phone", label: "Điện thoại", children: r.phone }, { key: "address", label: "Địa chỉ", children: r.address || "—" }, { key: "plan", label: "Cấu hình", children: `${r.configuration.product_name} / ${r.configuration.plan_name || "Gói tùy chỉnh"}` }]} />
 <p className="my-4 whitespace-pre-wrap">Yêu cầu thêm: {r.note || "—"}</p>
 <ul>{r.configuration.features.map(f => <li key={f.feature_id}>{f.name}: số lượng mua {f.quantity}{f.limit_value !== null ? `, hạn mức ${f.limit_value}` : ""}</li>)}</ul>
 <p className="my-4">Email: {r.email_sent} đã gửi · {r.email_pending} chưa gửi · {r.email_failed} hết lượt thử.</p>
 {!!r.email_failed && <Alert type="warning" title="Có email chưa gửi được sau 10 lần thử. Kiểm tra SMTP/PDF và xử lý hàng đợi theo hướng dẫn vận hành." />}
 <h2 className="my-4 text-lg font-semibold">Lịch sử báo giá</h2>
 {!r.quotes.length && <p>Chưa có báo giá.</p>}
 {r.quotes.map(q => <details key={q.id} className="mb-4"><summary>Phiên bản {q.version} · {q.total_minor.toLocaleString("en-US")} minor units {q.currency} · {q.accepted_at ? "Đã xác nhận" : q.version !== r.quotes[0].version ? "Đã thay thế" : "Chờ xác nhận"}</summary><ul>{q.lines.map((l, i) => <li key={i}>{l.description}: {l.quantity} × {l.unit_amount_minor.toLocaleString("en-US")} minor units</li>)}</ul><p className="whitespace-pre-wrap">{q.terms}</p><p>Hiệu lực đến: {formatDateTime(q.expires_at)}</p></details>)}
 {r.status === "accepted" ? <Alert type="success" title="Khách đã xác nhận báo giá. Xem đăng ký dịch vụ và khoản cần thu tương ứng trong mục Thanh toán." /> : <><h2 className="my-4 text-lg font-semibold">Lập báo giá</h2><QuoteForm key={`${r.id}-${r.quotes[0]?.version ?? 0}`} registration={r} onSaved={() => setSelected(null)} /></>}
 </>}
 </Modal></>;
}
