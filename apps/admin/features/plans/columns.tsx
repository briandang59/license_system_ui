import { displayLabel } from "@/lib/display-labels";
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
    { title: "Mã", dataIndex: "code" },
    { title: "Tên", dataIndex: "name" },
    { title: "Sản phẩm", render: (_, plan) => plan.product?.name ?? "Không có thông tin" },
    { title: "Tính năng", width: 290, render: (_, plan) => {
      if (plan.features === undefined) return <span className="text-muted">Không có thông tin</span>;
      if (!plan.features.length) return <span className="text-muted">Chưa cấu hình tính năng</span>;
      const enabled = plan.features.filter(feature => feature.enabled).length;
      return <div><div className="font-medium">{enabled} đang bật / {plan.features.length} đã cấu hình</div>
        <div className="mt-1 text-xs text-muted">{plan.features.slice(0, 3).map(feature => feature.name).join(", ")}{plan.features.length > 3 ? ` +${plan.features.length - 3} mục khác` : ""}</div>
        <Button type="link" size="small" className="!px-0" onClick={() => onAddFeatures(plan)}>Cấu hình tính năng</Button>
      </div>;
    } },
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
      render: (_, plan) => (
        <Space>
          <Button size="small" icon={<ListPlus size={16} aria-hidden="true" />}
            aria-label={`Cấu hình tính năng cho gói ${plan.name}`} title="Cấu hình tính năng"
            onClick={() => onAddFeatures(plan)} />
          <Button size="small" icon={<Eye size={16} aria-hidden="true" />}
            aria-label={`Xem gói dịch vụ ${plan.name}`} title="Xem gói dịch vụ"
            onClick={() => onView(plan.id)} />
          <Button size="small" icon={<Pencil size={16} aria-hidden="true" />}
            aria-label={`Sửa gói dịch vụ ${plan.name}`} title="Sửa gói dịch vụ"
            onClick={() => onEdit(plan.id)} />
          <Popconfirm
            title="Xóa gói dịch vụ?"
            description="Không thể hoàn tác thao tác này."
            onConfirm={() => {
              if (!isDeleting) onDelete(plan.id);
            }}
            okText="Xóa"
            okButtonProps={{ danger: true }}
          >
            <Button
              size="small"
              danger
              icon={<Trash2 size={16} aria-hidden="true" />}
              aria-label={`Xóa gói dịch vụ ${plan.name}`}
              title="Xóa gói dịch vụ"
              disabled={isDeleting}
              loading={isDeleting && deletingId === plan.id}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];
}
