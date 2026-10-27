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
import { ProductForm } from "@/features/products/form";
import {
  type Product,
} from "@/features/products/schema";
import { productService } from "@/features/products/service";
import { getApiErrorMessage } from "@/lib/api-errors";
import { getProductColumns } from "@/features/products/columns";
import { getProductDescriptionItems } from "@/features/products/descriptions";

export default function ProductsPage() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [dialog, setDialog] = useState<{
    mode: "create" | "edit" | "view";
    id?: number;
  } | null>(null);
  const products = useQuery({
    queryKey: ["products", "list", offset, search],
    queryFn: ({ signal }) => productService.getAll(offset, signal, search),
  });
  const detail = useQuery({
    queryKey: ["products", "detail", dialog?.id],
    queryFn: ({ signal }) => productService.getById(dialog!.id!, signal),
    enabled: dialog?.id !== undefined,
    staleTime: 0,
  });
  const remove = useMutation({
    mutationFn: productService.remove,
    onError: (error) => { void message.error(getApiErrorMessage(error)); },
    onSuccess: async () => {
      void message.success("Đã xóa sản phẩm.");
      setSelectedRowKeys([]);
      if (products.data?.items.length === 1 && offset > 0)
        setOffset(offset - 20);
      await queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Sản phẩm</h1>
          <p className="mt-2 text-sm text-muted">
            Tạo và quản lý danh mục sản phẩm.
          </p>
        </div>
        <Button type="primary" icon={<Plus size={16} aria-hidden="true" />} onClick={() => setDialog({ mode: "create" })}>
          Thêm sản phẩm
        </Button>
      </div>
      {products.isError && (
        <div role="alert" className="mb-5">
          <Alert
            type="error"
            title={getApiErrorMessage(products.error)}
            action={
              <Button
                icon={<RotateCw size={16} aria-hidden="true" />}
                onClick={() => {
                  void products.refetch();
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
          aria-label="Tìm sản phẩm"
          placeholder="Tìm theo tên hoặc mã"
          allowClear
          style={{ maxWidth: 420 }}
          enterButton={<Button aria-label="Tìm sản phẩm" title="Tìm sản phẩm" icon={<Search size={16} aria-hidden="true" />} />}
          onSearch={(value) => {
            setSearch(value.trim());
            setOffset(0);
            setSelectedRowKeys([]);
          }}
        />
        <div className="flex flex-wrap items-center gap-3"><DataTransferActions resource="products" filters={{search}} /><span className="text-sm text-muted" aria-live="polite">{selectedRowKeys.length} đã chọn</span></div>
      </div>
      <Table<Product>
        rowKey="id"
        rowSelection={{
          type: "checkbox",
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys),
        }}
        loading={products.isFetching}
        dataSource={products.data?.items ?? []}
        pagination={false}
        scroll={{ x: 700 }}
        columns={getProductColumns({
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
          disabled={offset === 0 || products.isFetching}
          onClick={() => { setOffset(offset - 20); setSelectedRowKeys([]); }}
        >
          Trước
        </Button>
        <span className="text-sm text-muted">Trang {offset / 20 + 1}</span>
        <Button
          icon={<ChevronRight size={16} aria-hidden="true" />}
          disabled={
            products.isFetching ||
            products.isError ||
            (products.data?.items.length ?? 0) < 20
          }
          onClick={() => { setOffset(offset + 20); setSelectedRowKeys([]); }}
        >
          Tiếp
        </Button>
      </div>
      <Modal
        title={
          dialog?.mode === "create"
            ? "Thêm sản phẩm"
            : dialog?.mode === "edit"
              ? "Sửa sản phẩm"
              : "Chi tiết sản phẩm"
        }
        open={!!dialog}
        onCancel={() => setDialog(null)}
        footer={null}
        destroyOnHidden
      >
        {dialog?.mode === "create" ? (
          <ProductForm onSaved={() => setDialog(null)} />
        ) : detail.isPending ? (
          <Spin aria-label="Đang tải sản phẩm" />
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
            <ProductForm
              key={detail.data.id}
              product={detail.data}
              onSaved={() => setDialog(null)}
            />
          ) : (
            <Descriptions
              column={1}
              items={getProductDescriptionItems(detail.data)}
            />
          ))
        )}
      </Modal>
    </div>
  );
}
