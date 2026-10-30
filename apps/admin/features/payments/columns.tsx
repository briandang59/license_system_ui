import { Button, Tag } from "antd";
import { Eye, Check } from "lucide-react";
import type { TableProps } from "antd";
import type { PaymentRequest, PaymentTransaction, SubscriptionChange, Entitlement } from "./schema";
import { formatNumber } from "@/utils/functions/formatNumber";
import { formatDateTime } from "@/utils/functions/formatDateTime";
export const paymentLabels: Record<string, string> = { pending: "Chờ thanh toán", partially_paid: "Thanh toán một phần", paid: "Đã thanh toán đủ", cancelled: "Đã hủy", confirmed: "Đã xác nhận", pending_review: "Chờ đối soát", rejected: "Không tính vào thanh toán", manual: "Thủ công", sepay: "SePay", cash: "Tiền mặt", bank_transfer: "Chuyển khoản", pending_payment: "Chờ thanh toán", applied: "Đã áp dụng" };
export function changeColumns(offset: number): TableProps<SubscriptionChange>["columns"] { return [{ title: "#", render: (_, __, i) => offset + i + 1 }, { title: "Nội dung", dataIndex: "description" }, { title: "Số tiền (đơn vị nhỏ nhất)", render: (_, v) => `${formatNumber(v.amount_minor)} ${v.currency}` }, { title: "Trạng thái", render: (_, v) => <Tag>{paymentLabels[v.status]}</Tag> }, { title: "Đã áp dụng", render: (_, v) => v.applied_at ? formatDateTime(v.applied_at) : "Chưa áp dụng" }]; }
export function entitlementColumns(offset: number): TableProps<Entitlement>["columns"] { return [{ title: "#", render: (_, __, i) => offset + i + 1 }, { title: "Tính năng", dataIndex: "name" }, { title: "Cho phép", render: (_, v) => v.enabled ? "Có" : "Không" }, { title: "Hạn mức", render: (_, v) => v.feature_type !== "quantity" ? "Không áp dụng" : v.limit_value === null ? "Chưa cấu hình" : formatNumber(v.limit_value) }]; }
export function requestColumns(offset: number, onView: (v: PaymentRequest) => void): TableProps<PaymentRequest>["columns"] { return [
 { title: "#", render: (_, __, i) => offset + i + 1 }, { title: "Mã thanh toán", dataIndex: "payment_code" }, { title: "Doanh nghiệp", dataIndex: "company_name" }, { title: "Nội dung", dataIndex: "description" },
 { title: "Cần thu / Đã thu (đơn vị nhỏ nhất)", render: (_, v) => <>{formatNumber(v.amount_minor)} / {formatNumber(v.paid_minor)} {v.currency}{v.paid_minor > v.amount_minor && <div>Thu thừa: {formatNumber(v.paid_minor - v.amount_minor)} {v.currency}</div>}</> },
 { title: "Trạng thái", render: (_, v) => <Tag>{paymentLabels[v.status]}</Tag> }, { title: "Thao tác", render: (_, v) => <Button icon={<Eye size={16} aria-hidden />} title="Xem thanh toán" aria-label={`Xem thanh toán ${v.payment_code}`} onClick={() => onView(v)} /> },
 ]; }
export function transactionColumns(offset: number, onReview: (v: PaymentTransaction) => void): TableProps<PaymentTransaction>["columns"] { return [
 { title: "#", render: (_, __, i) => offset + i + 1 }, { title: "Nguồn", render: (_, v) => paymentLabels[v.source] }, { title: "Số tiền (đơn vị nhỏ nhất)", render: (_, v) => `${formatNumber(v.amount_minor)} ${v.currency}` }, { title: "Ngày nhận", render: (_, v) => formatDateTime(v.received_at) },
 { title: "Đối soát", render: (_, v) => <><div>{paymentLabels[v.method]} · {v.account_number || "—"}</div><div>{v.reference || "Không có mã tham chiếu"}</div></> }, { title: "Người xác nhận", render: (_, v) => v.confirmed_by_email || (v.source === "sepay" && v.status === "confirmed" ? "Tự động" : "—") },
 { title: "Trạng thái", render: (_, v) => <><Tag>{paymentLabels[v.status]}</Tag>{v.duplicate_of && <div>Trùng giao dịch đã ghi nhận</div>}</> }, { title: "Ghi chú", dataIndex: "note" },
 { title: "Thao tác", render: (_, v) => v.status === "pending_review" ? <Button icon={<Check size={16} aria-hidden />} title="Đối soát giao dịch" aria-label={`Đối soát giao dịch ${v.reference || formatDateTime(v.received_at)}`} onClick={() => onReview(v)} /> : null },
 ]; }
