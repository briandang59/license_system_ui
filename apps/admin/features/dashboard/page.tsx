"use client";
import { useState } from "react";
import Link from "next/link";
import { Alert, Button, DatePicker, Empty, Select, Spin, Table } from "antd";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import PageHeader from "@/components/ui/page-header";
import SearchField from "@/components/ui/search-field";
import { getApiErrorMessage } from "@/lib/api-errors";
import { vietnamNow, pickerToVietnam, formatDateTime } from "@/utils/functions/formatDateTime";
import { dashboardService } from "./service";
import { formatMoneyMinor } from "./money";
import { receiptColumns } from "./columns";
import RevenueChart from "./revenue-chart";
export default function DashboardPage() {
 const [month, setMonth] = useState(() => vietnamNow().startOf("month")); const [search, setSearch] = useState(""); const [chosen, setChosen] = useState("VND");
 const from = month.startOf("month").toISOString(); const to = month.startOf("month").add(1, "month").toISOString();
 const query = useQuery({ queryKey: ["dashboard", from, to, search], queryFn: ({ signal }) => dashboardService.get(from, to, search, signal) }); const data = query.data;
 const currencies = data?.money.map(v => v.currency) ?? []; const currency = currencies.includes(chosen) ? chosen : currencies[0] ?? "VND"; const money = data?.money.find(v => v.currency === currency);
 const counters = data ? [ ["Doanh nghiệp", data.counts.companies, "/companies"], ["Đang sử dụng", data.counts.active_subscriptions, "/subscriptions"], ["Chờ thanh toán", data.counts.pending_subscriptions, "/subscriptions"], ["Hết hạn trong 30 ngày", data.counts.expiring_subscriptions, "/subscriptions"], ["Đăng ký cần xử lý", data.counts.open_registrations, "/registrations"], ["Giao dịch chờ đối soát", data.counts.pending_review, "/payments"] ] as const : [];
 return <><PageHeader title="Tổng quan" description="Theo dõi doanh thu thực thu, khoản cần thu và tình hình sử dụng dịch vụ." actions={<Button icon={<RefreshCw size={16} aria-hidden />} loading={query.isFetching} onClick={() => void query.refetch()}>Làm mới</Button>} />
 <div className="mb-6 flex flex-wrap items-center gap-3"><SearchField label="Tìm kiếm tổng quan" placeholder="Doanh nghiệp, mã số thuế, email, sản phẩm, gói dịch vụ…" onSearch={setSearch} /><DatePicker aria-label="Tháng báo cáo" picker="month" format="MM/YYYY" value={month} allowClear={false} onChange={v => { const next = pickerToVietnam(v); if(next) setMonth(next.startOf("month")); }} /><Select aria-label="Đơn vị tiền tệ" value={currency} onChange={setChosen} options={(currencies.length ? currencies : ["VND"]).map(value => ({ value, label: value }))} style={{ minWidth: 100 }} /></div>
 {query.isError && <Alert className="mb-6" type="error" title={getApiErrorMessage(query.error)} action={<Button onClick={() => void query.refetch()}>Thử lại</Button>} />}
 {query.isPending ? <Spin aria-label="Đang tải tổng quan" /> : data && <>
 <div className="grid gap-4 md:grid-cols-3">{[["Doanh thu thực thu trong tháng", money?.received_minor ?? "0", `${money?.receipt_count ?? 0} giao dịch đã xác nhận`], ["Còn phải thu hiện tại", money?.outstanding_minor ?? "0", `${money?.outstanding_requests ?? 0} khoản chưa thu đủ`], ["Thu thủ công / SePay trong tháng", money?.manual_minor ?? "0", `SePay: ${formatMoneyMinor(money?.sepay_minor ?? "0", currency)}`]].map(([label, amount, note]) => <article key={label} className="rounded-xl border border-line bg-surface p-6"><p className="text-sm text-muted">{label}</p><p className="mt-3 break-words text-2xl font-semibold tabular-nums">{formatMoneyMinor(amount, currency)}</p><p className="mt-2 text-sm text-muted">{note}</p></article>)}</div>
 <p className="mt-3 text-sm leading-6 text-muted">Thực thu tính theo ngày nhận tiền của giao dịch đã xác nhận, gồm cả tiền thu thừa. Không gồm giao dịch chờ đối soát hoặc bị từ chối. Số liệu tách riêng theo tiền tệ.</p>
 <div className="my-6 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">{counters.map(([label, count, href]) => <Link key={label} href={href} className="rounded-xl border border-line bg-surface p-4 transition-colors hover:border-accent"><p className="text-sm text-muted">{label}</p><p className="mt-3 text-2xl font-semibold tabular-nums">{new Intl.NumberFormat("vi-VN").format(count)}</p><p className="mt-2 text-xs text-muted">Hiện tại</p></Link>)}</div>
 <section className="rounded-xl border border-line bg-surface p-6"><h2 className="mb-6 text-lg font-semibold">Thực thu theo ngày · {month.format("MM/YYYY")}</h2><RevenueChart key={`${month.format("YYYY-MM")}-${currency}`} rows={data.daily} currency={currency} days={month.daysInMonth()} month={month.format("YYYY-MM")} /></section>
 <section className="mt-6 rounded-xl border border-line bg-surface p-4 sm:p-6"><h2 className="mb-4 text-lg font-semibold">10 khoản thu gần nhất trong kỳ · mọi tiền tệ</h2><Table rowKey="id" pagination={false} columns={receiptColumns} dataSource={data.recent} scroll={{ x: 900 }} locale={{ emptyText: <Empty description="Chưa có khoản thu đã xác nhận trong kỳ này." /> }} /></section>
 <p className="mt-4 text-xs text-muted">Cập nhật lúc {formatDateTime(data.calculated_at)} · Múi giờ Việt Nam.</p>
 </>}
 </>;
}
