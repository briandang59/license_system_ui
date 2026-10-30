"use client";
import DataTransferActions from "@/features/data-transfer/actions";
import { useState, type Key } from "react";
import { Alert, App, Button, Descriptions, Input, Modal, Spin, Table, } from "antd";
import { Plus, Search, RotateCw, ChevronLeft, ChevronRight } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UnitForm } from "@/features/units/form";
import { type Unit, } from "@/features/units/schema";
import { unitService } from "@/features/units/service";
import { getApiErrorMessage } from "@/lib/api-errors";
import { getUnitColumns } from "@/features/units/columns";
import { getUnitDescriptionItems } from "@/features/units/descriptions";
export default function UnitsPage() {
    const { message } = App.useApp();
    const queryClient = useQueryClient();
    const [offset, setOffset] = useState(0);
    const [search, setSearch] = useState("");
    const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
    const [dialog, setDialog] = useState<{
        mode: "create" | "edit" | "view";
        id?: number;
    } | null>(null);
    const units = useQuery({
        queryKey: ["units", "list", offset, search],
        queryFn: ({ signal }) => unitService.getAll(offset, signal, search),
    });
    const detail = useQuery({
        queryKey: ["units", "detail", dialog?.id],
        queryFn: ({ signal }) => unitService.getById(dialog!.id!, signal),
        enabled: dialog?.id !== undefined,
        staleTime: 0,
    });
    const remove = useMutation({
        mutationFn: unitService.remove,
        onError: (error) => { void message.error(getApiErrorMessage(error)); },
        onSuccess: async () => {
            void message.success("Đã xóa đơn vị tính.");
            setSelectedRowKeys([]);
            if (units.data?.items.length === 1 && offset > 0)
                setOffset(offset - 20);
            await queryClient.invalidateQueries({ queryKey: ["units"] });
        },
    });
    return (<div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Đơn vị tính</h1>
          <p className="mt-2 text-sm text-muted">
            Tạo và quản lý đơn vị tính.
          </p>
        </div>
        <Button type="primary" icon={<Plus size={16} aria-hidden="true"/>} onClick={() => setDialog({ mode: "create" })}>
          Thêm đơn vị tính
        </Button>
      </div>
      {units.isError && (<div role="alert" className="mb-5">
          <Alert type="error" title={getApiErrorMessage(units.error)} action={<Button icon={<RotateCw size={16} aria-hidden="true"/>} onClick={() => {
                    void units.refetch();
                }}>
                Thử lại
              </Button>}/>
        </div>)}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Input.Search aria-label="Tìm đơn vị tính" placeholder="Tên, mã, ký hiệu hoặc trạng thái" allowClear style={{ maxWidth: 420 }} enterButton={<Button aria-label="Tìm đơn vị tính" title="Tìm đơn vị tính" icon={<Search size={16} aria-hidden="true"/>}/>} onSearch={(value) => {
            setSearch(value.trim());
            setOffset(0);
            setSelectedRowKeys([]);
        }}/>
        <div className="flex flex-wrap items-center gap-3"><DataTransferActions resource="units" filters={{search}} /><span className="text-sm text-muted" aria-live="polite">{selectedRowKeys.length} đã chọn</span></div>
      </div>
      <Table<Unit> rowKey="id" rowSelection={{
            type: "checkbox",
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
        }} loading={units.isFetching} dataSource={units.data?.items ?? []} pagination={false} scroll={{ x: 700 }} columns={getUnitColumns({
            offset,
            onView: (id) => setDialog({ mode: "view", id }),
            onEdit: (id) => setDialog({ mode: "edit", id }),
            onDelete: (id) => remove.mutate(id),
            isDeleting: remove.isPending,
            deletingId: remove.variables,
        })}/>
      <div className="mt-4 flex items-center justify-end gap-3">
        <Button icon={<ChevronLeft size={16} aria-hidden="true"/>} disabled={offset === 0 || units.isFetching} onClick={() => { setOffset(offset - 20); setSelectedRowKeys([]); }}>
          Trước
        </Button>
        <span className="text-sm text-muted">Trang {offset / 20 + 1}</span>
        <Button icon={<ChevronRight size={16} aria-hidden="true"/>} disabled={units.isFetching ||
            units.isError ||
            (units.data?.items.length ?? 0) < 20} onClick={() => { setOffset(offset + 20); setSelectedRowKeys([]); }}>
          Tiếp
        </Button>
      </div>
      <Modal title={dialog?.mode === "create"
            ? "Thêm đơn vị tính"
            : dialog?.mode === "edit"
                ? "Sửa đơn vị tính"
                : "Chi tiết đơn vị tính"} open={!!dialog} onCancel={() => setDialog(null)} footer={null} destroyOnHidden>
        {dialog?.mode === "create" ? (<UnitForm onSaved={() => setDialog(null)}/>) : detail.isPending ? (<Spin aria-label="Đang tải đơn vị tính"/>) : detail.isError ? (<div role="alert">
            <Alert type="error" title={getApiErrorMessage(detail.error)} action={<Button icon={<RotateCw size={16} aria-hidden="true"/>} onClick={() => void detail.refetch()}>Thử lại</Button>}/>
          </div>) : (detail.data &&
            (dialog?.mode === "edit" ? (<UnitForm key={detail.data.id} unit={detail.data} onSaved={() => setDialog(null)}/>) : (<Descriptions column={1} items={getUnitDescriptionItems(detail.data)}/>)))}
      </Modal>
    </div>);
}
