import { displayLabel } from "@/lib/display-labels";
import { Button, Popconfirm, Space, Tag, type TableProps } from "antd";
import { Eye, Pencil, Trash2 } from "lucide-react";
import type { Feature } from "@/features/features/schema";

type FeatureColumnActions = {
  offset: number;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  isDeleting: boolean;
  deletingId?: number;
};

export function getFeatureColumns({
  offset,
  onView,
  onEdit,
  onDelete,
  isDeleting,
  deletingId,
}: FeatureColumnActions): NonNullable<TableProps<Feature>["columns"]> {
  return [
    { title: "#", key: "index", width: 70, render: (_, __, index) => offset + index + 1 },
    { title: "Mã", dataIndex: "code" },
    { title: "Tên", dataIndex: "name" },
    { title: "Loại", dataIndex: "feature_type", render: (value: string) => displayLabel(value) },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (status: string) => (
        <Tag color={status === "active" ? "green" : "default"}>
          {displayLabel(status)}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      render: (_, feature) => (
        <Space>
          <Button size="small" icon={<Eye size={16} aria-hidden="true" />}
            aria-label={`Xem tính năng ${feature.name}`} title="Xem tính năng"
            onClick={() => onView(feature.id)} />
          <Button size="small" icon={<Pencil size={16} aria-hidden="true" />}
            aria-label={`Sửa tính năng ${feature.name}`} title="Sửa tính năng"
            onClick={() => onEdit(feature.id)} />
          <Popconfirm
            title="Xóa tính năng?"
            description="Không thể hoàn tác thao tác này."
            onConfirm={() => {
              if (!isDeleting) onDelete(feature.id);
            }}
            okText="Xóa"
            okButtonProps={{ danger: true }}
          >
            <Button
              size="small"
              danger
              icon={<Trash2 size={16} aria-hidden="true" />}
              aria-label={`Xóa tính năng ${feature.name}`}
              title="Xóa tính năng"
              disabled={isDeleting}
              loading={isDeleting && deletingId === feature.id}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];
}
