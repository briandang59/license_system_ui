import type { DescriptionsProps } from "antd";
import type { Plan } from "@/features/plans/schema";
import { formatDateTime } from "@/utils/functions/formatDateTime";

export function getPlanDescriptionItems(record: Plan): NonNullable<DescriptionsProps["items"]> {
  return [
    { key: "code", label: "Code", children: record.code },
    { key: "name", label: "Name", children: record.name },
    { key: "description", label: "Description", children: record.description || "—" },
    { key: "status", label: "Status", children: record.status },
    { key: "created_at", label: "Created", children: formatDateTime(record.created_at) },
    { key: "updated_at", label: "Updated", children: formatDateTime(record.updated_at) },
  ];
}
