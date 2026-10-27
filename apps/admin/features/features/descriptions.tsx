import UnitLabel from "@/features/units/unit-label";
import type { DescriptionsProps } from "antd";
import type { Feature } from "@/features/features/schema";
import { formatDateTime } from "@/utils/functions/formatDateTime";

export function getFeatureDescriptionItems(record: Feature): NonNullable<DescriptionsProps["items"]> {
  return [
    { key: "code", label: "Code", children: record.code },
    { key: "name", label: "Name", children: record.name },
    { key: "description", label: "Description", children: record.description || "—" },
    { key: "feature_type", label: "Feature type", children: record.feature_type },
    { key: "unit", label: "Unit", children: <UnitLabel id={record.unit_id} fallback={record.unit} /> },
    { key: "status", label: "Status", children: record.status },
    { key: "created_at", label: "Created", children: formatDateTime(record.created_at) },
    { key: "updated_at", label: "Updated", children: formatDateTime(record.updated_at) },
  ];
}
