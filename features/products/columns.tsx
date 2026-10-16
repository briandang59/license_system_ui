import { Button, Popconfirm, Space, Tag, type TableProps } from "antd";
import type { Product } from "@/features/products/schema";

type ProductColumnActions = {
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  isDeleting: boolean;
  deletingId?: number;
};

export function getProductColumns({
  onView,
  onEdit,
  onDelete,
  isDeleting,
  deletingId,
}: ProductColumnActions): NonNullable<TableProps<Product>["columns"]> {
  return [
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
          <Button size="small" onClick={() => onView(product.id)}>
            View
          </Button>
          <Button size="small" onClick={() => onEdit(product.id)}>
            Edit
          </Button>
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
              disabled={isDeleting}
              loading={isDeleting && deletingId === product.id}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];
}
