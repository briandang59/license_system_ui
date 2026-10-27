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
  const [formPending, setFormPending] = useState(false);
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
      void message.success("Đã xóa tính năng.");
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
          <h1 className="text-2xl font-semibold">Tính năng</h1>
          <p className="mt-2 text-sm text-muted">
            Tạo và quản lý tính năng.
          </p>
        </div>
        <Button type="primary" icon={<Plus size={16} aria-hidden="true" />} onClick={() => setDialog({ mode: "create" })}>
          Thêm tính năng
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
                Thử lại
              </Button>
            }
          />
        </div>
      )}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Input.Search
          aria-label="Tìm tính năng"
          placeholder="Tìm theo tên hoặc mã"
          allowClear
          style={{ maxWidth: 420 }}
          enterButton={<Button aria-label="Tìm tính năng" title="Tìm tính năng" icon={<Search size={16} aria-hidden="true" />} />}
          onSearch={(value) => {
            setSearch(value.trim());
            setOffset(0);
            setSelectedRowKeys([]);
          }}
        />
        <div className="flex flex-wrap items-center gap-3"><DataTransferActions resource="features" filters={{search}} /><span className="text-sm text-muted" aria-live="polite">{selectedRowKeys.length} đã chọn</span></div>
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
          Trước
        </Button>
        <span className="text-sm text-muted">Trang {offset / 20 + 1}</span>
        <Button
          icon={<ChevronRight size={16} aria-hidden="true" />}
          disabled={
            features.isFetching ||
            features.isError ||
            (features.data?.items.length ?? 0) < 20
          }
          onClick={() => { setOffset(offset + 20); setSelectedRowKeys([]); }}
        >
          Tiếp
        </Button>
      </div>
      <Modal
        title={
          dialog?.mode === "create"
            ? "Thêm tính năng"
            : dialog?.mode === "edit"
              ? "Sửa tính năng"
              : "Chi tiết tính năng"
        }
        open={!!dialog}
        width={720}
        closable={!formPending} keyboard={!formPending} mask={{ closable: !formPending }}
        onCancel={() => { if (!formPending) setDialog(null); }}
        footer={null}
        destroyOnHidden
      >
        {dialog?.mode === "create" ? (
          <FeatureForm onPendingChange={setFormPending} onSaved={() => setDialog(null)} />
        ) : detail.isPending ? (
          <Spin aria-label="Đang tải tính năng" />
        ) : detail.isError ? (
          <div role="alert">
            <Alert
              type="error"
              title={getApiErrorMessage(detail.error)}
              action={
                <Button icon={<RotateCw size={16} aria-hidden="true" />} onClick={() => void detail.refetch()}>Thử lại</Button>
              }
            />
          </div>
        ) : (
          detail.data &&
          (dialog?.mode === "edit" ? (
            <FeatureForm
              key={detail.data.id}
              feature={detail.data}
              onPendingChange={setFormPending}
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
