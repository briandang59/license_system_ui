import type { DescriptionsProps } from "antd";
import type { Unit } from "@/features/units/schema";
import { formatDateTime } from "@/utils/functions/formatDateTime";
export function getUnitDescriptionItems(record: Unit): NonNullable<DescriptionsProps["items"]> {
    return [
        { key: "symbol", label: "Symbol", children: record.symbol || "Not set" },
        { key: "code", label: "Code", children: record.code },
        { key: "name", label: "Name", children: record.name },
        { key: "status", label: "Status", children: record.status },
        { key: "created_at", label: "Created", children: formatDateTime(record.created_at) },
        { key: "updated_at", label: "Updated", children: formatDateTime(record.updated_at) },
    ];
}
