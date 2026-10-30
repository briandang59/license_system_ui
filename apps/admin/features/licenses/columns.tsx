import type { TableProps } from "antd";
import type { License } from "./schema";
import { formatDateTime } from "@/utils/functions/formatDateTime";
export const licenseLabels: Record<string,string> = { active: "Đang hoạt động", inactive: "Chưa hoạt động", expired: "Đã hết hạn", suspended: "Tạm ngưng", revoked: "Đã thu hồi" };
export const licenseColumns = (offset: number): TableProps<License>["columns"] => [
 { title: "#", render: (_, __, i) => offset+i+1, width: 70 }, { title: "Doanh nghiệp", dataIndex: "company_name" }, { title: "Sản phẩm", dataIndex: "product_name" }, { title: "Trạng thái", dataIndex: "status", render: v => licenseLabels[v] ?? "Chưa xác định" }, { title: "Hiệu lực từ", dataIndex: "valid_from", render: v => formatDateTime(v) }, { title: "Hiệu lực đến", dataIndex: "valid_until", render: v => v ? formatDateTime(v) : "Không giới hạn" }, { title: "Kích hoạt / giới hạn", render: (_, r) => `${r.active_activations} / ${r.max_activations ?? "Không giới hạn"}` }, { title: "Số quyền lợi", dataIndex: "feature_count" },
];
