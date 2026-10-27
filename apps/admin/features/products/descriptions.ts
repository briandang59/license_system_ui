import type { DescriptionsProps } from "antd";
import type { Product } from "@/features/products/schema";
import { formatDateTime } from "@/utils/functions/formatDateTime";

export function getProductDescriptionItems(
  product: Product,
): NonNullable<DescriptionsProps["items"]> {
  return [
    { key: "code", label: "Code", children: product.code },
    { key: "name", label: "Name", children: product.name },
    {
      key: "description",
      label: "Description",
      children: product.description || "—",
    },
    {
      key: "status",
      label: "Status",
      children: product.status,
    },
    {
      key: "created",
      label: "Created",
      children: formatDateTime(product.created_at),
    },
    {
      key: "updated",
      label: "Updated",
      children: formatDateTime(product.updated_at),
    },
  ];
}
