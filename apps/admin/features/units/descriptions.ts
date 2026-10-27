import { displayLabel } from "@/lib/display-labels";
import type { DescriptionsProps } from "antd";
import type { Unit } from "@/features/units/schema";
import { formatDateTime } from "@/utils/functions/formatDateTime";
export function getUnitDescriptionItems(record: Unit): NonNullable<DescriptionsProps["items"]> {
    return [
        { key: "symbol", label: "Ký hiệu", children: record.symbol || "Chưa thiết lập" },
        { key: "code", label: "Mã", children: record.code },
        { key: "name", label: "Tên", children: record.name },
        { key: "status", label: "Trạng thái", children: displayLabel(record.status) },
        { key: "created_at", label: "Ngày tạo", children: formatDateTime(record.created_at) },
        { key: "updated_at", label: "Ngày cập nhật", children: formatDateTime(record.updated_at) },
    ];
}
