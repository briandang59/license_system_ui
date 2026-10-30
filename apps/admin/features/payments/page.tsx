"use client";
import { useState } from "react";
import { Alert, Button, Descriptions, Modal, Select, Spin, Table, Tabs } from "antd";
import { useQuery } from "@tanstack/react-query";
import { getApiErrorMessage } from "@/lib/api-errors";
import { formatNumber } from "@/utils/functions/formatNumber";
import { paymentService } from "./service";
import type { PaymentRequest, PaymentTransaction } from "./schema";
import { paymentLabels, requestColumns, transactionColumns } from "./columns";
import ManualPaymentForm from "./manual-form";
import ReviewForm from "./review-form";
function Pager({ offset, busy, hasNext, onChange }: { offset: number; busy: boolean; hasNext: boolean; onChange: (v: number) => void }) { return <div className="my-4 flex justify-end gap-2"><Button disabled={!offset || busy} onClick={() => onChange(offset - 20)}>Trước</Button><Button disabled={!hasNext || busy} onClick={() => onChange(offset + 20)}>Tiếp</Button></div>; }
export function TransactionList({ requestId }: { requestId?: number }) {
 const [offset, setOffset] = useState(0); const [status, setStatus] = useState(requestId ? "" : "pending_review"); const [review, setReview] = useState<PaymentTransaction | null>(null);
 const list = useQuery({ queryKey: ["payments", "transactions", requestId, offset, status], queryFn: ({ signal }) => paymentService.transactions(offset, requestId, status, signal), refetchInterval: 15000 });
 return <><Select aria-label="Lọc trạng thái giao dịch" className="mb-4" style={{ minWidth: 200 }} value={status} options={[{ value: "", label: "Tất cả giao dịch" }, ...["pending_review", "confirmed", "rejected"].map(value => ({ value, label: paymentLabels[value] }))]} onChange={v => { setStatus(v); setOffset(0); }} />{list.isError && <Alert type="error" title={getApiErrorMessage(list.error)} action={<Button onClick={() => void list.refetch()}>Thử lại</Button>} />}<Table<PaymentTransaction> rowKey="id" pagination={false} loading={list.isFetching} dataSource={list.data?.items ?? []} columns={transactionColumns(offset, setReview)} scroll={{ x: 1000 }} /><Pager offset={offset} busy={list.isFetching} hasNext={!list.isError && (list.data?.items.length ?? 0) === 20} onChange={setOffset} /><Modal title="Đối soát giao dịch" open={review !== null} onCancel={() => setReview(null)} footer={null} destroyOnHidden>{review && <ReviewForm transaction={review} onSaved={() => setReview(null)} />}</Modal></>;
}
export function PaymentDetail({ id, onClose }: { id: number; onClose: () => void }) {
 const [manual, setManual] = useState(false); const detail = useQuery({ queryKey: ["payments", "detail", id], queryFn: ({ signal }) => paymentService.detail(id, signal), refetchInterval: 15000 }); const v = detail.data;
 return <Modal title="Chi tiết thanh toán" open onCancel={onClose} footer={null} width={1100} destroyOnHidden>
 {detail.isPending ? <Spin aria-label="Đang tải thanh toán" /> : detail.isError ? <Alert type="error" title={getApiErrorMessage(detail.error)} action={<Button onClick={() => void detail.refetch()}>Thử lại</Button>} /> : v && <>
 <Descriptions column={{ xs: 1, sm: 2 }} items={[{ key: "code", label: "Mã thanh toán / nội dung chuyển khoản", children: v.payment_code }, { key: "company", label: "Doanh nghiệp", children: v.company_name }, { key: "amount", label: "Cần thu (đơn vị nhỏ nhất)", children: `${formatNumber(v.amount_minor)} ${v.currency}` }, { key: "paid", label: "Đã nhận (đơn vị nhỏ nhất)", children: `${formatNumber(v.paid_minor)} ${v.currency}` }, { key: "status", label: "Trạng thái", children: paymentLabels[v.status] }, { key: "description", label: "Nội dung", children: v.description }]} />
 {v.paid_minor > v.amount_minor && <Alert className="my-4" type="warning" title={`Thu thừa ${formatNumber(v.paid_minor - v.amount_minor)} ${v.currency} (đơn vị nhỏ nhất). Cần xử lý hoàn trả hoặc đối soát riêng.`} />}
 <Button className="my-4" type="primary" disabled={v.status === "cancelled" || !["pending", "active"].includes(v.subscription_status)} onClick={() => setManual(true)}>Ghi nhận tiền đã nhận</Button>
 <TransactionList requestId={id} />
 <Modal title="Ghi nhận thanh toán thủ công" open={manual} onCancel={() => setManual(false)} footer={null} destroyOnHidden>{manual && <ManualPaymentForm request={v} onSaved={() => setManual(false)} />}</Modal>
 </>}
 </Modal>;
}
export function PaymentRequests({ subscriptionId }: { subscriptionId?: number }) {
 const [offset, setOffset] = useState(0); const [status, setStatus] = useState(""); const [selected, setSelected] = useState<React.Key[]>([]); const [detail, setDetail] = useState<number | null>(null);
 const list = useQuery({ queryKey: ["payments", "requests", subscriptionId, offset, status], queryFn: ({ signal }) => paymentService.list(offset, status, subscriptionId, signal), refetchInterval: 15000 });
 return <><Select aria-label="Lọc trạng thái thanh toán" className="mb-4" style={{ minWidth: 210 }} value={status} options={[{ value: "", label: "Tất cả khoản cần thu" }, ...["pending", "partially_paid", "paid", "cancelled"].map(value => ({ value, label: paymentLabels[value] }))]} onChange={v => { setStatus(v); setOffset(0); setSelected([]); }} />{list.isError && <Alert type="error" title={getApiErrorMessage(list.error)} action={<Button onClick={() => void list.refetch()}>Thử lại</Button>} />}<Table<PaymentRequest> rowKey="id" loading={list.isFetching} dataSource={list.data?.items ?? []} pagination={false} rowSelection={{ selectedRowKeys: selected, onChange: setSelected }} columns={requestColumns(offset, v => setDetail(v.id))} scroll={{ x: 850 }} /><Pager offset={offset} busy={list.isFetching} hasNext={!list.isError && (list.data?.items.length ?? 0) === 20} onChange={v => { setOffset(v); setSelected([]); }} />{detail !== null && <PaymentDetail key={detail} id={detail} onClose={() => setDetail(null)} />}</>;
}
export default function PaymentsPage() { return <><h1 className="mb-2 text-2xl font-semibold">Thanh toán</h1><p className="mb-6 text-muted">Ghi nhận tiền thực nhận qua nhiều lần thanh toán và đối soát giao dịch SePay.</p><Tabs items={[{ key: "requests", label: "Khoản cần thu", children: <PaymentRequests /> }, { key: "transactions", label: "Đối soát giao dịch", children: <TransactionList /> }]} /></>; }
