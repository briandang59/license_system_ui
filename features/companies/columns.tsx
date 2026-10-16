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
    { title: "Code", dataIndex: "code" },
    { title: "Name", dataIndex: "name" },
    { title: "Email", dataIndex: "email" },
    { title: "Phone", dataIndex: "phone" },
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
      render: (_, company) => (
        <Space>
          <Button size="small" icon={<Eye size={16} aria-hidden="true" />}
            aria-label={`View company ${company.name}`} title="View company"
            onClick={() => onView(company.id)} />
          <Button size="small" icon={<Pencil size={16} aria-hidden="true" />}
            aria-label={`Edit company ${company.name}`} title="Edit company"
            onClick={() => onEdit(company.id)} />
          <Popconfirm
            title="Delete company?"
            description="This action cannot be undone."
            onConfirm={() => {
              if (!isDeleting) onDelete(company.id);
            }}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
            <Button
              size="small"
              danger
              icon={<Trash2 size={16} aria-hidden="true" />}
              aria-label={`Delete company ${company.name}`}
              title="Delete company"
              disabled={isDeleting}
              loading={isDeleting && deletingId === company.id}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];
}
