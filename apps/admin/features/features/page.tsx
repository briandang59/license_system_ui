"use client";
import DataTransferActions from "@/features/data-transfer/actions";
import PricingPanel from "@/features/pricing/panel";

import { useState, type Key } from "react";
import {
  Alert,
  App,
  Button,
  Descriptions,
  Input,
  Modal,
  Spin,
  Table,
} from "antd";
import { Plus, Search, RotateCw, ChevronLeft, ChevronRight } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FeatureForm } from "@/features/features/form";
import {
  type Feature,
} from "@/features/features/schema";
import { featureService } from "@/features/features/service";
import { getApiErrorMessage } from "@/lib/api-errors";
import { getFeatureColumns } from "@/features/features/columns";
import { getFeatureDescriptionItems } from "@/features/features/descriptions";

export default function FeaturesPage() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [dialog, setDialog] = useState<{
    mode: "create" | "edit" | "view";
    id?: number;
  } | null>(null);
  const features = useQuery({
    queryKey: ["features", "list", offset, search],
    queryFn: ({ signal }) => featureService.getAll(offset, signal, search),
  });
  const detail = useQuery({
    queryKey: ["features", "detail", dialog?.id],
    queryFn: ({ signal }) => featureService.getById(dialog!.id!, signal),
    enabled: dialog?.id !== undefined,
    staleTime: 0,
  });
  const remove = useMutation({
    mutationFn: featureService.remove,
    onError: (error) => { void message.error(getApiErrorMessage(error)); },
    onSuccess: async () => {
      void message.success("Feature deleted.");
      setSelectedRowKeys([]);
      if (features.data?.items.length === 1 && offset > 0)
        setOffset(offset - 20);
      await queryClient.invalidateQueries({ queryKey: ["features"] });
    },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Features</h1>
          <p className="mt-2 text-sm text-muted">
            Create and manage your features.
          </p>
        </div>
        <Button type="primary" icon={<Plus size={16} aria-hidden="true" />} onClick={() => setDialog({ mode: "create" })}>
          Add feature
        </Button>
      </div>
      {features.isError && (
        <div role="alert" className="mb-5">
          <Alert
            type="error"
            title={getApiErrorMessage(features.error)}
            action={
              <Button
                icon={<RotateCw size={16} aria-hidden="true" />}
                onClick={() => {
                  void features.refetch();
                }}
              >
                Retry
              </Button>
            }
          />
        </div>
      )}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Input.Search
          aria-label="Search features"
          placeholder="Search name or code"
          allowClear
          style={{ maxWidth: 420 }}
          enterButton={<Button aria-label="Search features" title="Search features" icon={<Search size={16} aria-hidden="true" />} />}
          onSearch={(value) => {
            setSearch(value.trim());
            setOffset(0);
            setSelectedRowKeys([]);
          }}
        />
        <div className="flex flex-wrap items-center gap-3"><DataTransferActions resource="features" filters={{search}} /><span className="text-sm text-muted" aria-live="polite">{selectedRowKeys.length} selected</span></div>
      </div>
      <Table<Feature>
        rowKey="id"
        rowSelection={{
          type: "checkbox",
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys),
        }}
        loading={features.isFetching}
        dataSource={features.data?.items ?? []}
        pagination={false}
        scroll={{ x: 700 }}
        columns={getFeatureColumns({
          offset,
          onView: (id) => setDialog({ mode: "view", id }),
          onEdit: (id) => setDialog({ mode: "edit", id }),
          onDelete: (id) => remove.mutate(id),
          isDeleting: remove.isPending,
          deletingId: remove.variables,
        })}
      />
      <div className="mt-4 flex items-center justify-end gap-3">
        <Button
          icon={<ChevronLeft size={16} aria-hidden="true" />}
          disabled={offset === 0 || features.isFetching}
          onClick={() => { setOffset(offset - 20); setSelectedRowKeys([]); }}
        >
          Previous
        </Button>
        <span className="text-sm text-muted">Page {offset / 20 + 1}</span>
        <Button
          icon={<ChevronRight size={16} aria-hidden="true" />}
          disabled={
            features.isFetching ||
            features.isError ||
            (features.data?.items.length ?? 0) < 20
          }
          onClick={() => { setOffset(offset + 20); setSelectedRowKeys([]); }}
        >
          Next
        </Button>
      </div>
      <Modal
        title={
          dialog?.mode === "create"
            ? "Add feature"
            : dialog?.mode === "edit"
              ? "Edit feature"
              : "Feature details"
        }
        open={!!dialog}
        onCancel={() => setDialog(null)}
        footer={null}
        destroyOnHidden
      >
        {dialog?.mode === "create" ? (
          <FeatureForm onSaved={() => setDialog(null)} />
        ) : detail.isPending ? (
          <Spin aria-label="Loading feature" />
        ) : detail.isError ? (
          <div role="alert">
            <Alert
              type="error"
              title={getApiErrorMessage(detail.error)}
              action={
                <Button icon={<RotateCw size={16} aria-hidden="true" />} onClick={() => void detail.refetch()}>Retry</Button>
              }
            />
          </div>
        ) : (
          detail.data &&
          (dialog?.mode === "edit" ? (
            <FeatureForm
              key={detail.data.id}
              feature={detail.data}
              onSaved={() => setDialog(null)}
            />
          ) : (
            <><Descriptions column={1} items={getFeatureDescriptionItems(detail.data)} /><PricingPanel kind="features" parent={detail.data.id} name={detail.data.name} /></>
          ))
        )}
      </Modal>
    </div>
  );
}
