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
import { ProductForm } from "@/features/products/form";
import {
  type Product,
} from "@/features/products/schema";
import { productService } from "@/features/products/service";
import { getApiErrorMessage } from "@/lib/api-errors";
import { getProductColumns } from "@/features/products/columns";
import { getProductDescriptionItems } from "@/features/products/descriptions";

export default function ProductsPage() {
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
    onSuccess: async () => {
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
          <h1 className="text-2xl font-semibold">Products</h1>
          <p className="mt-2 text-sm text-muted">
            Create and manage your product catalog.
          </p>
        </div>
        <Button type="primary" icon={<Plus size={16} aria-hidden="true" />} onClick={() => setDialog({ mode: "create" })}>
          Add product
        </Button>
      </div>
      {(products.isError || remove.isError) && (
        <div role="alert" className="mb-5">
          <Alert
            type="error"
            title={getApiErrorMessage(remove.error ?? products.error)}
            action={
              <Button
                icon={<RotateCw size={16} aria-hidden="true" />}
                onClick={() => {
                  remove.reset();
                  void products.refetch();
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
          aria-label="Search products"
          placeholder="Search name or code"
          allowClear
          style={{ maxWidth: 420 }}
          enterButton={<Button aria-label="Search products" title="Search products" icon={<Search size={16} aria-hidden="true" />} />}
          onSearch={(value) => {
            setSearch(value.trim());
            setOffset(0);
            setSelectedRowKeys([]);
          }}
        />
        <span className="text-sm text-muted" aria-live="polite">{selectedRowKeys.length} selected</span>
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
          Previous
        </Button>
        <span className="text-sm text-muted">Page {offset / 20 + 1}</span>
        <Button
          icon={<ChevronRight size={16} aria-hidden="true" />}
          disabled={
            products.isFetching ||
            products.isError ||
            (products.data?.items.length ?? 0) < 20
          }
          onClick={() => { setOffset(offset + 20); setSelectedRowKeys([]); }}
        >
          Next
        </Button>
      </div>
      <Modal
        title={
          dialog?.mode === "create"
            ? "Add product"
            : dialog?.mode === "edit"
              ? "Edit product"
              : "Product details"
        }
        open={!!dialog}
        onCancel={() => setDialog(null)}
        footer={null}
        destroyOnHidden
      >
        {dialog?.mode === "create" ? (
          <ProductForm onSaved={() => setDialog(null)} />
        ) : detail.isPending ? (
          <Spin aria-label="Loading product" />
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
