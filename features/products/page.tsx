"use client";

import { useState } from "react";
import {
  Alert,
  Button,
  Descriptions,
  Modal,
  Popconfirm,
  Space,
  Spin,
  Table,
  Tag,
} from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ProductForm } from "@/features/products/form";
import {
  type Product,
} from "@/features/products/schema";
import { productService } from "@/features/products/service";
import { getApiErrorMessage } from "@/lib/api-errors";
import { formatDateTime } from "@/utils/functions/formatDateTime";

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [offset, setOffset] = useState(0);
  const [dialog, setDialog] = useState<{
    mode: "create" | "edit" | "view";
    id?: number;
  } | null>(null);
  const products = useQuery({
    queryKey: ["products", "list", offset],
    queryFn: ({ signal }) => productService.getAll(offset, signal),
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
          <p className="mt-2 text-sm text-slate-500">
            Create and manage your product catalog.
          </p>
        </div>
        <Button type="primary" onClick={() => setDialog({ mode: "create" })}>
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
      <Table<Product>
        rowKey="id"
        loading={products.isFetching}
        dataSource={products.data?.items ?? []}
        pagination={false}
        scroll={{ x: 700 }}
        columns={[
          { title: "Code", dataIndex: "code" },
          { title: "Name", dataIndex: "name" },
          {
            title: "Status",
            dataIndex: "status",
            render: (status: string) => (
              <Tag color={status === "active" ? "green" : "default"}>
                {status}
              </Tag>
            ),
          },
          {
            title: "Actions",
            render: (_, product) => (
              <Space>
                <Button
                  size="small"
                  onClick={() => setDialog({ mode: "view", id: product.id })}
                >
                  View
                </Button>
                <Button
                  size="small"
                  onClick={() => setDialog({ mode: "edit", id: product.id })}
                >
                  Edit
                </Button>
                <Popconfirm
                  title="Delete product?"
                  description="This action cannot be undone."
                  onConfirm={() => {
                    if (!remove.isPending) remove.mutate(product.id);
                  }}
                  okText="Delete"
                  okButtonProps={{ danger: true }}
                >
                  <Button
                    size="small"
                    danger
                    disabled={remove.isPending}
                    loading={
                      remove.isPending && remove.variables === product.id
                    }
                  >
                    Delete
                  </Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />
      <div className="mt-4 flex items-center justify-end gap-3">
        <Button
          disabled={offset === 0 || products.isFetching}
          onClick={() => setOffset(offset - 20)}
        >
          Previous
        </Button>
        <span className="text-sm text-slate-500">Page {offset / 20 + 1}</span>
        <Button
          disabled={
            products.isFetching ||
            products.isError ||
            (products.data?.items.length ?? 0) < 20
          }
          onClick={() => setOffset(offset + 20)}
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
                <Button onClick={() => void detail.refetch()}>Retry</Button>
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
              items={[
                { key: "code", label: "Code", children: detail.data.code },
                { key: "name", label: "Name", children: detail.data.name },
                {
                  key: "description",
                  label: "Description",
                  children: detail.data.description || "—",
                },
                {
                  key: "status",
                  label: "Status",
                  children: detail.data.status,
                },
                {
                  key: "created",
                  label: "Created",
                  children: formatDateTime(detail.data.created_at),
                },
                {
                  key: "updated",
                  label: "Updated",
                  children: formatDateTime(detail.data.updated_at),
                },
              ]}
            />
          ))
        )}
      </Modal>
    </div>
  );
}
