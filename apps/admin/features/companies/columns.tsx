import { displayLabel } from "@/lib/display-labels";
import { Button, Popconfirm, Space, Tag, type TableProps } from "antd";
import { Eye, Pencil, Trash2 } from "lucide-react";
import type { Company } from "@/features/companies/schema";

type CompanyColumnActions = {
  offset: number;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  isDeleting: boolean;
  deletingId?: number;
};

export function getCompanyColumns({
  offset,
  onView,
  onEdit,
  onDelete,
  isDeleting,
  deletingId,
}: CompanyColumnActions): NonNullable<TableProps<Company>["columns"]> {
  return [
    { title: "#", key: "index", width: 70, render: (_, __, index) => offset + index + 1 },
    { title: "Mã", dataIndex: "code" },
    { title: "Tên", dataIndex: "name" },
    { title: "Email", dataIndex: "email" },
    { title: "Số điện thoại", dataIndex: "phone" },
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
      render: (_, company) => (
        <Space>
          <Button size="small" icon={<Eye size={16} aria-hidden="true" />}
            aria-label={`Xem doanh nghiệp ${company.name}`} title="Xem doanh nghiệp"
            onClick={() => onView(company.id)} />
          <Button size="small" icon={<Pencil size={16} aria-hidden="true" />}
            aria-label={`Sửa doanh nghiệp ${company.name}`} title="Sửa doanh nghiệp"
            onClick={() => onEdit(company.id)} />
          <Popconfirm
            title="Xóa doanh nghiệp?"
            description="Không thể hoàn tác thao tác này."
            onConfirm={() => {
              if (!isDeleting) onDelete(company.id);
            }}
            okText="Xóa"
            okButtonProps={{ danger: true }}
          >
            <Button
              size="small"
              danger
              icon={<Trash2 size={16} aria-hidden="true" />}
              aria-label={`Xóa doanh nghiệp ${company.name}`}
              title="Xóa doanh nghiệp"
              disabled={isDeleting}
              loading={isDeleting && deletingId === company.id}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];
}
