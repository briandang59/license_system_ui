import { displayLabel } from "@/lib/display-labels";
import UnitLabel from "@/features/units/unit-label";
import type { DescriptionsProps } from "antd";
import type { Feature } from "@/features/features/schema";
import { formatDateTime } from "@/utils/functions/formatDateTime";

export function getFeatureDescriptionItems(record: Feature): NonNullable<DescriptionsProps["items"]> {
  return [
    { key: "code", label: "Mã", children: record.code },
    { key: "name", label: "Tên", children: record.name },
    { key: "description", label: "Mô tả", children: record.description || "—" },
    { key: "feature_type", label: "Loại tính năng", children: displayLabel(record.feature_type) },
    { key: "unit", label: "Đơn vị tính", children: <UnitLabel id={record.unit_id} fallback={record.unit} /> },
    { key: "status", label: "Trạng thái", children: displayLabel(record.status) },
    { key: "created_at", label: "Ngày tạo", children: formatDateTime(record.created_at) },
    { key: "updated_at", label: "Ngày cập nhật", children: formatDateTime(record.updated_at) },
  ];
}
