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
import { PlanForm } from "@/features/plans/form";
import {
  type Plan,
} from "@/features/plans/schema";
import { planService } from "@/features/plans/service";
import { getApiErrorMessage } from "@/lib/api-errors";
import { getPlanColumns } from "@/features/plans/columns";
import { getPlanDescriptionItems } from "@/features/plans/descriptions";
import PlanFeaturesModal from "@/features/plans/plan-features-modal";
import IncludedFeatures from "@/features/plans/included-features";

export default function PlansPage() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [featurePlan, setFeaturePlan] = useState<Plan | null>(null);
  const [dialog, setDialog] = useState<{
    mode: "create" | "edit" | "view";
    id?: number;
  } | null>(null);
  const [formPending, setFormPending] = useState(false);
  const plans = useQuery({
    queryKey: ["plans", "list", offset, search],
    queryFn: ({ signal }) => planService.getAll(offset, signal, search),
  });
  const detail = useQuery({
    queryKey: ["plans", "detail", dialog?.id],
    queryFn: ({ signal }) => planService.getById(dialog!.id!, signal),
    enabled: dialog?.id !== undefined,
    staleTime: 0,
  });
  const remove = useMutation({
    mutationFn: planService.remove,
    onError: (error) => { void message.error(getApiErrorMessage(error)); },
    onSuccess: async () => {
      void message.success("Đã xóa gói dịch vụ.");
      setSelectedRowKeys([]);
      if (plans.data?.items.length === 1 && offset > 0)
        setOffset(offset - 20);
      await queryClient.invalidateQueries({ queryKey: ["plans"] });
    },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Gói dịch vụ</h1>
          <p className="mt-2 text-sm text-muted">
            Xem tính năng và hạn mức của từng gói. Mở rộng một dòng để xem toàn bộ quyền lợi đã cấu hình.
          </p>
        </div>
        <Button type="primary" icon={<Plus size={16} aria-hidden="true" />} onClick={() => setDialog({ mode: "create" })}>
          Thêm gói dịch vụ
        </Button>
      </div>
      {plans.isError && (
        <div role="alert" className="mb-5">
          <Alert
            type="error"
            title={getApiErrorMessage(plans.error)}
            action={
              <Button
                icon={<RotateCw size={16} aria-hidden="true" />}
                onClick={() => {
                  void plans.refetch();
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
          aria-label="Tìm gói dịch vụ"
          placeholder="Tìm theo tên hoặc mã"
          allowClear
          style={{ maxWidth: 420 }}
          enterButton={<Button aria-label="Tìm gói dịch vụ" title="Tìm gói dịch vụ" icon={<Search size={16} aria-hidden="true" />} />}
          onSearch={(value) => {
            setSearch(value.trim());
            setOffset(0);
            setSelectedRowKeys([]);
          }}
        />
        <div className="flex flex-wrap items-center gap-3"><DataTransferActions resource="plans" filters={{search}} /><span className="text-sm text-muted" aria-live="polite">{selectedRowKeys.length} đã chọn</span></div>
      </div>
      <Table<Plan>
        rowKey="id"
        rowSelection={{
          type: "checkbox",
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys),
        }}
        loading={plans.isFetching}
        dataSource={plans.data?.items ?? []}
        pagination={false}
        scroll={{ x: 1100 }}
        expandable={{
          expandedRowRender: plan => <section aria-label={`Tính năng trong gói ${plan.name}`} className="p-2"><IncludedFeatures plan={plan} /></section>,
          rowExpandable: plan => plan.features !== undefined && plan.features.length > 0,
          columnTitle: "Chi tiết",
        }}
        columns={getPlanColumns({
          offset,
          onAddFeatures: setFeaturePlan,
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
          disabled={offset === 0 || plans.isFetching}
          onClick={() => { setOffset(offset - 20); setSelectedRowKeys([]); }}
        >
          Trước
        </Button>
        <span className="text-sm text-muted">Trang {offset / 20 + 1}</span>
        <Button
          icon={<ChevronRight size={16} aria-hidden="true" />}
          disabled={
            plans.isFetching ||
            plans.isError ||
            (plans.data?.items.length ?? 0) < 20
          }
          onClick={() => { setOffset(offset + 20); setSelectedRowKeys([]); }}
        >
          Tiếp
        </Button>
      </div>
      <Modal
        title={
          dialog?.mode === "create"
            ? "Thêm gói dịch vụ"
            : dialog?.mode === "edit"
              ? "Sửa gói dịch vụ"
              : "Chi tiết gói dịch vụ"
        }
        open={!!dialog}
        width={dialog?.mode === "view" ? 960 : 720}
        closable={!formPending} keyboard={!formPending} mask={{ closable: !formPending }}
        onCancel={() => { if (!formPending) setDialog(null); }}
        footer={null}
        destroyOnHidden
      >
        {dialog?.mode === "create" ? (
          <PlanForm onPendingChange={setFormPending} onSaved={() => setDialog(null)} />
        ) : detail.isPending ? (
          <Spin aria-label="Đang tải gói dịch vụ" />
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
            <PlanForm
              key={detail.data.id}
              plan={detail.data}
              onPendingChange={setFormPending}
              onSaved={() => setDialog(null)}
            />
          ) : (
            <><Descriptions column={1} items={getPlanDescriptionItems(detail.data)} />
              <section className="mt-6 border-t border-line pt-5">
                <h3 className="mb-3 text-lg font-semibold">Tính năng trong gói</h3>
                <IncludedFeatures plan={plans.data?.items.find(plan => plan.id === detail.data.id) ?? detail.data} />
              </section>
              <PricingPanel kind="plans" parent={detail.data.id} name={detail.data.name} /></>
          ))
        )}
      </Modal>
      {featurePlan && <PlanFeaturesModal key={featurePlan.id} plan={plans.data?.items.find(plan => plan.id === featurePlan.id) ?? featurePlan} onClose={() => setFeaturePlan(null)} />}
    </div>
  );
}
