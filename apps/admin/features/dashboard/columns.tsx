import type { TableProps } from "antd";
import type { Receipt } from "./schema";
import { formatMoneyMinor } from "./money";
import { formatDateTime } from "@/utils/functions/formatDateTime";
export const receiptColumns: TableProps<Receipt>["columns"] = [
 { title: "Doanh nghiệp", dataIndex: "company_name" }, { title: "Gói dịch vụ", dataIndex: "plan_name" },
 { title: "Mã thanh toán", dataIndex: "payment_code" },
 { title: "Thời điểm nhận", dataIndex: "received_at", render: v => formatDateTime(v) },
 { title: "Nguồn", dataIndex: "source", render: v => v === "manual" ? "Thủ công" : "SePay" },
 { title: "Thực nhận", align: "right", render: (_, r) => formatMoneyMinor(r.amount_minor, r.currency) },
];
