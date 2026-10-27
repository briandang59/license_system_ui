"use client";

import { useState, type ReactNode } from "react";
import { Alert, Button, Input, Table, Tag } from "antd";
import { ChevronLeft, ChevronRight, RotateCw, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { featureService } from "@/features/features/service";
import type { Feature } from "@/features/features/schema";
import { getApiErrorMessage } from "@/lib/api-errors";

export type FeatureOption = Pick<Feature, "id" | "product_id" | "name" | "code" | "feature_type" | "unit" | "unit_id">;

export default function FeaturePicker({
  productId, assignedFeatureIds, selectedIds, onChange, disabled, renderConfiguration,
}: {
  productId: number;
  assignedFeatureIds: number[];
  selectedIds: number[];
  onChange: (features: FeatureOption[]) => void;
  disabled: boolean;
  renderConfiguration: (feature: FeatureOption) => ReactNode;
}) {
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const features = useQuery({
    queryKey: ["features", "list", offset, search],
    queryFn: ({ signal }) => featureService.getAll(offset, signal, search),
  });

  function changePage(next: number) {
    setOffset(next);
    onChange([]);
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Input.Search
          aria-label="Search features" placeholder="Search features by name or code" allowClear
          disabled={disabled} style={{ maxWidth: 420 }}
          enterButton={<Button aria-label="Search features" title="Search features" icon={<Search size={16} aria-hidden="true" />} />}
          onSearch={(value, event) => { event?.preventDefault(); setSearch(value.trim()); changePage(0); }}
        />
        <span className={`rounded-md px-3 py-1.5 text-xs font-medium ${selectedIds.length ? "bg-accent-soft text-accent" : "bg-surface-subtle text-muted"}`} aria-live="polite">
          {selectedIds.length} selected
        </span>
      </div>
      {features.isError && (
        <div role="alert" className="mb-4">
          <Alert type="error" title={getApiErrorMessage(features.error)}
            action={<Button icon={<RotateCw size={16} aria-hidden="true" />} onClick={() => void features.refetch()}>Retry</Button>} />
        </div>
      )}
      <div className="overflow-hidden rounded-lg border border-line">
      <Table<Feature>
        rowKey="id" size="small" loading={features.isFetching}
        dataSource={features.data?.items ?? []} pagination={false} scroll={{ x: 930, y: "min(420px, 45vh)" }}
        rowSelection={{
          selectedRowKeys: selectedIds,
          onChange: (_, rows) => onChange(rows),
          getCheckboxProps: (feature) => ({
            disabled: disabled || features.isFetching || features.isError || feature.product_id !== productId || assignedFeatureIds.includes(feature.id),
            "aria-label": `Select feature ${feature.name}`,
          }),
        }}
        columns={[
          { title: "#", key: "index", width: 50, render: (_, __, index) => <span className="text-muted">{offset + index + 1}</span> },
          { title: "Feature", key: "feature", width: 260, render: (_, feature) => <div className="min-w-0 py-1">
            <div className="font-medium text-foreground wrap-anywhere">{feature.name}</div>
            <div className="mt-1 text-xs text-muted wrap-anywhere">{feature.code}</div>
          </div> },
          { title: "Type", dataIndex: "feature_type", width: 115, render: (type: Feature["feature_type"]) =>
            <span className="text-xs text-muted">
              {type === "quantity" ? "Quantity" : type === "unlimited" ? "Unlimited" : "Boolean"}
            </span>,
          },
          { title: "Configuration", key: "configuration", width: 310, render: (_, feature) => renderConfiguration(feature) },
          { title: "Status", key: "availability", width: 150, render: (_, feature) =>
            assignedFeatureIds.includes(feature.id) ? <Tag>Already added</Tag>
              : feature.product_id !== productId ? <Tag title="Only features from the plan's product can be added.">Different product</Tag>
                : <span className="text-xs text-positive">Available</span>,
          },
        ]}
      />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-muted">Only features from this plan’s product can be added.</span>
        <div className="flex items-center gap-2">
        <Button size="small" icon={<ChevronLeft size={14} aria-hidden="true" />} disabled={disabled || offset === 0 || features.isFetching}
          onClick={() => changePage(offset - 20)}>Previous</Button>
        <span className="px-2 text-xs text-muted">Page {offset / 20 + 1}</span>
        <Button size="small" icon={<ChevronRight size={14} aria-hidden="true" />}
          disabled={disabled || features.isFetching || features.isError || (features.data?.items.length ?? 0) < 20}
          onClick={() => changePage(offset + 20)}>Next</Button>
        </div>
      </div>
    </>
  );
}
