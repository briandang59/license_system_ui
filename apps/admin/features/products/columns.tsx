import { displayLabel } from "@/lib/display-labels";
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
    { title: "Mã", dataIndex: "code" },
    { title: "Tên", dataIndex: "name" },
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
      render: (_, product) => (
        <Space>
          <Button size="small" icon={<Eye size={16} aria-hidden="true" />}
            aria-label={`Xem sản phẩm ${product.name}`} title="Xem sản phẩm"
            onClick={() => onView(product.id)} />
          <Button size="small" icon={<Pencil size={16} aria-hidden="true" />}
            aria-label={`Sửa sản phẩm ${product.name}`} title="Sửa sản phẩm"
            onClick={() => onEdit(product.id)} />
          <Popconfirm
            title="Xóa sản phẩm?"
            description="Không thể hoàn tác thao tác này."
            onConfirm={() => {
              if (!isDeleting) onDelete(product.id);
            }}
            okText="Xóa"
            okButtonProps={{ danger: true }}
          >
            <Button
              size="small"
              danger
              icon={<Trash2 size={16} aria-hidden="true" />}
              aria-label={`Xóa sản phẩm ${product.name}`}
              title="Xóa sản phẩm"
              disabled={isDeleting}
              loading={isDeleting && deletingId === product.id}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];
}
