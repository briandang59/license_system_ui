import { Button, Popconfirm, Space, Tag, type TableProps } from "antd";
import { Eye, Pencil, Trash2 } from "lucide-react";
import type { Product } from "@/features/products/schema";

type ProductColumnActions = {
  offset: number;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  isDeleting: boolean;
  deletingId?: number;
};

export function getProductColumns({
  offset,
  onView,
  onEdit,
  onDelete,
  isDeleting,
  deletingId,
}: ProductColumnActions): NonNullable<TableProps<Product>["columns"]> {
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
      render: (_, product) => (
        <Space>
          <Button size="small" icon={<Eye size={16} aria-hidden="true" />}
            aria-label={`View product ${product.name}`} title="View product"
            onClick={() => onView(product.id)} />
          <Button size="small" icon={<Pencil size={16} aria-hidden="true" />}
            aria-label={`Edit product ${product.name}`} title="Edit product"
            onClick={() => onEdit(product.id)} />
          <Popconfirm
            title="Delete product?"
            description="This action cannot be undone."
            onConfirm={() => {
              if (!isDeleting) onDelete(product.id);
            }}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
            <Button
              size="small"
              danger
              icon={<Trash2 size={16} aria-hidden="true" />}
              aria-label={`Delete product ${product.name}`}
              title="Delete product"
              disabled={isDeleting}
              loading={isDeleting && deletingId === product.id}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];
}
