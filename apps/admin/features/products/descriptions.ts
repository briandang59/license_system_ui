import type { DescriptionsProps } from "antd";
import { displayLabel } from "@/lib/display-labels";
import type { Product } from "@/features/products/schema";
import { formatDateTime } from "@/utils/functions/formatDateTime";

export function getProductDescriptionItems(
  product: Product,
): NonNullable<DescriptionsProps["items"]> {
  return [
    { key: "code", label: "Mã", children: product.code },
    { key: "name", label: "Tên", children: product.name },
    {
      key: "description",
      label: "Mô tả",
      children: product.description || "—",
    },
    {
      key: "status",
      label: "Trạng thái",
      children: displayLabel(product.status),
    },
    {
      key: "created",
      label: "Ngày tạo",
      children: formatDateTime(product.created_at),
    },
    {
      key: "updated",
      label: "Ngày cập nhật",
      children: formatDateTime(product.updated_at),
    },
  ];
}
