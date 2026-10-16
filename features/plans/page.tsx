"use client";

import { useState, type Key } from "react";
import {
  Alert,
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

export default function PlansPage() {
  const queryClient = useQueryClient();
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [featurePlan, setFeaturePlan] = useState<Plan | null>(null);
  const [dialog, setDialog] = useState<{
    mode: "create" | "edit" | "view";
    id?: number;
  } | null>(null);
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
    onSuccess: async () => {
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
          <h1 className="text-2xl font-semibold">Plans</h1>
          <p className="mt-2 text-sm text-slate-500">
            Create and manage your plans.
          </p>
        </div>
        <Button type="primary" icon={<Plus size={16} aria-hidden="true" />} onClick={() => setDialog({ mode: "create" })}>
          Add plan
        </Button>
      </div>
      {(plans.isError || remove.isError) && (
        <div role="alert" className="mb-5">
          <Alert
            type="error"
            title={getApiErrorMessage(remove.error ?? plans.error)}
            action={
              <Button
                icon={<RotateCw size={16} aria-hidden="true" />}
                onClick={() => {
                  remove.reset();
                  void plans.refetch();
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
          aria-label="Search plans"
          placeholder="Search name or code"
          allowClear
          style={{ maxWidth: 420 }}
          enterButton={<Button aria-label="Search plans" title="Search plans" icon={<Search size={16} aria-hidden="true" />} />}
          onSearch={(value) => {
            setSearch(value.trim());
            setOffset(0);
            setSelectedRowKeys([]);
          }}
        />
        <span className="text-sm text-slate-500" aria-live="polite">{selectedRowKeys.length} selected</span>
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
        scroll={{ x: 700 }}
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
          Previous
        </Button>
        <span className="text-sm text-slate-500">Page {offset / 20 + 1}</span>
        <Button
          icon={<ChevronRight size={16} aria-hidden="true" />}
          disabled={
            plans.isFetching ||
            plans.isError ||
            (plans.data?.items.length ?? 0) < 20
          }
          onClick={() => { setOffset(offset + 20); setSelectedRowKeys([]); }}
        >
          Next
        </Button>
      </div>
      <Modal
        title={
          dialog?.mode === "create"
            ? "Add plan"
            : dialog?.mode === "edit"
              ? "Edit plan"
              : "Plan details"
        }
        open={!!dialog}
        onCancel={() => setDialog(null)}
        footer={null}
        destroyOnHidden
      >
        {dialog?.mode === "create" ? (
          <PlanForm onSaved={() => setDialog(null)} />
        ) : detail.isPending ? (
          <Spin aria-label="Loading plan" />
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
            <PlanForm
              key={detail.data.id}
              plan={detail.data}
              onSaved={() => setDialog(null)}
            />
          ) : (
            <Descriptions
              column={1}
              items={getPlanDescriptionItems(detail.data)}
            />
          ))
        )}
      </Modal>
      {featurePlan && <PlanFeaturesModal key={featurePlan.id} plan={featurePlan} onClose={() => setFeaturePlan(null)} />}
    </div>
  );
}
