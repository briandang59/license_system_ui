import { displayLabel } from "@/lib/display-labels";
import { Table, Tag } from "antd";
import UnitLabel from "@/features/units/unit-label";
import type { Plan } from "./schema";
import PlanFeatureEditor from "./plan-feature-editor";

type IncludedFeature = NonNullable<Plan["features"]>[number];

export default function IncludedFeatures({ plan }: { plan: Plan }) {
  if (plan.features === undefined) return <p className="text-sm text-muted">Không có thông tin chi tiết tính năng.</p>;
  if (!plan.features.length) return <p className="text-sm text-muted">Chưa có tính năng. Chọn Cấu hình tính năng để thêm quyền lợi.</p>;
  return <Table<IncludedFeature> size="small" rowKey="feature_id" pagination={false}
    dataSource={plan.features} scroll={{ x: 600, y: 320 }}
    columns={[
      { title: "Tính năng", render: (_, feature) => <div><span className="font-medium">{feature.name}</span><div className="text-xs text-muted">{feature.code}</div></div> },
      { title: "Loại", dataIndex: "feature_type", render: (value: string) => displayLabel(value) },
      { title: "Trạng thái sử dụng", render: (_, feature) => <Tag color={feature.enabled ? "green" : "default"}>{feature.enabled ? "Bật" : "Tắt"}</Tag> },
      { title: "Hạn mức", render: (_, feature) => feature.feature_type === "quantity"
        ? feature.limit_value === null ? "Chưa cấu hình" : <span>{feature.limit_value.toLocaleString("vi-VN")} <UnitLabel id={feature.unit_id} fallback={feature.unit} /></span>
        : feature.feature_type === "unlimited" ? "Không giới hạn" : "—" },
      { title: "Thao tác", width: 90, render: (_, feature) => <PlanFeatureEditor planId={plan.id} feature={feature} /> },
    ]}
  />;
}
