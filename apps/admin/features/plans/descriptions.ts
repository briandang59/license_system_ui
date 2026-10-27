import { displayLabel } from "@/lib/display-labels";
import type { DescriptionsProps } from "antd";
import type { Plan } from "@/features/plans/schema";
import { formatDateTime } from "@/utils/functions/formatDateTime";

export function getPlanDescriptionItems(record: Plan): NonNullable<DescriptionsProps["items"]> {
  return [
    { key: "code", label: "Mã", children: record.code },
    { key: "name", label: "Tên", children: record.name },
    { key: "description", label: "Mô tả", children: record.description || "—" },
    { key: "status", label: "Trạng thái", children: displayLabel(record.status) },
    { key: "created_at", label: "Ngày tạo", children: formatDateTime(record.created_at) },
    { key: "updated_at", label: "Ngày cập nhật", children: formatDateTime(record.updated_at) },
  ];
}
