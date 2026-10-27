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
    { title: "Code", dataIndex: "code" },
    { title: "Name", dataIndex: "name" },
    { title: "Type", dataIndex: "feature_type" },
    {
      title: "Status",
      dataIndex: "status",
      render: (status: string) => (
        <Tag color={status === "active" ? "green" : "default"}>
          {status}
        </Tag>
      ),
    },
    {
      title: "Actions",
      render: (_, feature) => (
        <Space>
          <Button size="small" icon={<Eye size={16} aria-hidden="true" />}
            aria-label={`View feature ${feature.name}`} title="View feature"
            onClick={() => onView(feature.id)} />
          <Button size="small" icon={<Pencil size={16} aria-hidden="true" />}
            aria-label={`Edit feature ${feature.name}`} title="Edit feature"
            onClick={() => onEdit(feature.id)} />
          <Popconfirm
            title="Delete feature?"
            description="This action cannot be undone."
            onConfirm={() => {
              if (!isDeleting) onDelete(feature.id);
            }}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
            <Button
              size="small"
              danger
              icon={<Trash2 size={16} aria-hidden="true" />}
              aria-label={`Delete feature ${feature.name}`}
              title="Delete feature"
              disabled={isDeleting}
              loading={isDeleting && deletingId === feature.id}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];
}
