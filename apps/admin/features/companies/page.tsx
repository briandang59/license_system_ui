"use client";
import DataTransferActions from "@/features/data-transfer/actions";

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
import { CompanyForm } from "@/features/companies/form";
import {
  type Company,
} from "@/features/companies/schema";
import { companyService } from "@/features/companies/service";
import { getApiErrorMessage } from "@/lib/api-errors";
import { getCompanyColumns } from "@/features/companies/columns";
import { getCompanyDescriptionItems } from "@/features/companies/descriptions";

export default function CompaniesPage() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [dialog, setDialog] = useState<{
    mode: "create" | "edit" | "view";
    id?: number;
  } | null>(null);
  const companies = useQuery({
    queryKey: ["companies", "list", offset, search],
    queryFn: ({ signal }) => companyService.getAll(offset, signal, search),
  });
  const detail = useQuery({
    queryKey: ["companies", "detail", dialog?.id],
    queryFn: ({ signal }) => companyService.getById(dialog!.id!, signal),
    enabled: dialog?.id !== undefined,
    staleTime: 0,
  });
  const remove = useMutation({
    mutationFn: companyService.remove,
    onError: (error) => { void message.error(getApiErrorMessage(error)); },
    onSuccess: async () => {
      void message.success("Đã xóa doanh nghiệp.");
      setSelectedRowKeys([]);
      if (companies.data?.items.length === 1 && offset > 0)
        setOffset(offset - 20);
      await queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Doanh nghiệp</h1>
          <p className="mt-2 text-sm text-muted">
            Tạo và quản lý doanh nghiệp.
          </p>
        </div>
        <Button type="primary" icon={<Plus size={16} aria-hidden="true" />} onClick={() => setDialog({ mode: "create" })}>
          Thêm doanh nghiệp
        </Button>
      </div>
      {companies.isError && (
        <div role="alert" className="mb-5">
          <Alert
            type="error"
            title={getApiErrorMessage(companies.error)}
            action={
              <Button
                icon={<RotateCw size={16} aria-hidden="true" />}
                onClick={() => {
                  void companies.refetch();
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
          aria-label="Tìm doanh nghiệp"
          placeholder="Tìm theo tên, mã, mã số thuế, email hoặc số điện thoại"
          allowClear
          style={{ maxWidth: 420 }}
          enterButton={<Button aria-label="Tìm doanh nghiệp" title="Tìm doanh nghiệp" icon={<Search size={16} aria-hidden="true" />} />}
          onSearch={(value) => {
            setSearch(value.trim());
            setOffset(0);
            setSelectedRowKeys([]);
          }}
        />
        <div className="flex flex-wrap items-center gap-3"><DataTransferActions resource="companies" filters={{search}} /><span className="text-sm text-muted" aria-live="polite">{selectedRowKeys.length} đã chọn</span></div>
      </div>
      <Table<Company>
        rowKey="id"
        rowSelection={{
          type: "checkbox",
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys),
        }}
        loading={companies.isFetching}
        dataSource={companies.data?.items ?? []}
        pagination={false}
        scroll={{ x: 700 }}
        columns={getCompanyColumns({
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
          disabled={offset === 0 || companies.isFetching}
          onClick={() => { setOffset(offset - 20); setSelectedRowKeys([]); }}
        >
          Trước
        </Button>
        <span className="text-sm text-muted">Trang {offset / 20 + 1}</span>
        <Button
          icon={<ChevronRight size={16} aria-hidden="true" />}
          disabled={
            companies.isFetching ||
            companies.isError ||
            (companies.data?.items.length ?? 0) < 20
          }
          onClick={() => { setOffset(offset + 20); setSelectedRowKeys([]); }}
        >
          Tiếp
        </Button>
      </div>
      <Modal
        title={
          dialog?.mode === "create"
            ? "Thêm doanh nghiệp"
            : dialog?.mode === "edit"
              ? "Sửa doanh nghiệp"
              : "Chi tiết doanh nghiệp"
        }
        open={!!dialog}
        onCancel={() => setDialog(null)}
        footer={null}
        destroyOnHidden
      >
        {dialog?.mode === "create" ? (
          <CompanyForm onSaved={() => setDialog(null)} />
        ) : detail.isPending ? (
          <Spin aria-label="Đang tải doanh nghiệp" />
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
            <CompanyForm
              key={detail.data.id}
              company={detail.data}
              onSaved={() => setDialog(null)}
            />
          ) : (
            <Descriptions
              column={1}
              items={getCompanyDescriptionItems(detail.data)}
            />
          ))
        )}
      </Modal>
    </div>
  );
}
