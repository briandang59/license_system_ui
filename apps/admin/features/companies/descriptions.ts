import type { DescriptionsProps } from "antd";
import type { Company } from "@/features/companies/schema";
import { formatDateTime } from "@/utils/functions/formatDateTime";

export function getCompanyDescriptionItems(record: Company): NonNullable<DescriptionsProps["items"]> {
  return [
    { key: "code", label: "Code", children: record.code },
    { key: "name", label: "Name", children: record.name },
    { key: "tax_code", label: "Tax code", children: record.tax_code || "—" },
    { key: "email", label: "Email", children: record.email || "—" },
    { key: "phone", label: "Phone", children: record.phone || "—" },
    { key: "status", label: "Status", children: record.status },
    { key: "created_at", label: "Created", children: formatDateTime(record.created_at) },
    { key: "updated_at", label: "Updated", children: formatDateTime(record.updated_at) },
  ];
}
