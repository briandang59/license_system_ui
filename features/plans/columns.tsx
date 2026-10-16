import { Button, Popconfirm, Space, Tag, type TableProps } from "antd";
import { Eye, Pencil, Trash2, ListPlus } from "lucide-react";
import type { Plan } from "@/features/plans/schema";

type PlanColumnActions = {
  offset: number;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onAddFeatures: (plan: Plan) => void;
  isDeleting: boolean;
  deletingId?: number;
};

export function getPlanColumns({
  offset,
  onView,
  onEdit,
  onDelete,
  onAddFeatures,
  isDeleting,
  deletingId,
}: PlanColumnActions): NonNullable<TableProps<Plan>["columns"]> {
  return [
    { title: "#", key: "index", width: 70, render: (_, __, index) => offset + index + 1 },
    { title: "Code", dataIndex: "code" },
    { title: "Name", dataIndex: "name" },
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
      render: (_, plan) => (
        <Space>
          <Button size="small" icon={<ListPlus size={16} aria-hidden="true" />}
            aria-label={`Add features to plan ${plan.name}`} title="Add features"
            onClick={() => onAddFeatures(plan)} />
          <Button size="small" icon={<Eye size={16} aria-hidden="true" />}
            aria-label={`View plan ${plan.name}`} title="View plan"
            onClick={() => onView(plan.id)} />
          <Button size="small" icon={<Pencil size={16} aria-hidden="true" />}
            aria-label={`Edit plan ${plan.name}`} title="Edit plan"
            onClick={() => onEdit(plan.id)} />
          <Popconfirm
            title="Delete plan?"
            description="This action cannot be undone."
            onConfirm={() => {
              if (!isDeleting) onDelete(plan.id);
            }}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
            <Button
              size="small"
              danger
              icon={<Trash2 size={16} aria-hidden="true" />}
              aria-label={`Delete plan ${plan.name}`}
              title="Delete plan"
              disabled={isDeleting}
              loading={isDeleting && deletingId === plan.id}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];
}
