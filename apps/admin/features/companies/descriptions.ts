import { displayLabel } from "@/lib/display-labels";
import type { DescriptionsProps } from "antd";
import type { Company } from "@/features/companies/schema";
import { formatDateTime } from "@/utils/functions/formatDateTime";

export function getCompanyDescriptionItems(record: Company): NonNullable<DescriptionsProps["items"]> {
  return [
    { key: "code", label: "Mã", children: record.code },
    { key: "name", label: "Tên", children: record.name },
    { key: "tax_code", label: "Mã số thuế", children: record.tax_code || "—" },
    { key: "email", label: "Email", children: record.email || "—" },
    { key: "phone", label: "Số điện thoại", children: record.phone || "—" },
    { key: "status", label: "Trạng thái", children: displayLabel(record.status) },
    { key: "created_at", label: "Ngày tạo", children: formatDateTime(record.created_at) },
    { key: "updated_at", label: "Ngày cập nhật", children: formatDateTime(record.updated_at) },
  ];
}
