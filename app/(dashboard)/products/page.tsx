"use client";

import { useState } from "react";
import {
  Alert,
  Button,
  Descriptions,
  Form,
  Modal,
  Popconfirm,
  Select,
  Space,
  Spin,
  Table,
  Tag,
} from "antd";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import FormInput from "@/components/form/form-input";
import {
  productInputSchema,
  type Product,
  type ProductInput,
} from "@/lib/product-schema";
import { productService } from "@/services/product.service";
import { getApiErrorMessage } from "@/lib/api-errors";

function ProductForm({
  product,
  onSaved,
}: {
  product?: Product;
  onSaved: () => void;
}) {
  const queryClient = useQueryClient();
  const { control, handleSubmit } = useForm<ProductInput>({
    resolver: zodResolver(productInputSchema),
    defaultValues: product
      ? {
          code: product.code,
          name: product.name,
          description: product.description ?? "",
          status: product.status,
        }
      : { code: "", name: "", description: "", status: "active" },
  });
  const save = useMutation({
    mutationFn: (data: ProductInput) =>
      product
        ? productService.update(product.id, {
            name: data.name,
            description: data.description,
            status: data.status,
          })
        : productService.create(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      onSaved();
    },
  });
  return (
    <form
      noValidate
      onSubmit={handleSubmit((data) => {
        if (!save.isPending) save.mutate(data);
      })}
    >
      <FormInput
        control={control}
        name="code"
        label="Code"
        disabled={!!product || save.isPending}
      />
      <FormInput
        control={control}
        name="name"
        label="Name"
        disabled={save.isPending}
      />
      <FormInput
        control={control}
        name="description"
        label="Description"
        disabled={save.isPending}
      />
      <Controller
        control={control}
        name="status"
        render={({ field, fieldState }) => (
          <Form.Item
            label="Status"
            htmlFor="product-status"
            layout="vertical"
            validateStatus={fieldState.error ? "error" : undefined}
            help={fieldState.error?.message}
          >
            <Select
              {...field}
              id="product-status"
              disabled={save.isPending}
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
            />
          </Form.Item>
        )}
      />
      {save.isError && (
        <div role="alert" className="mb-4">
          <Alert type="error" title={getApiErrorMessage(save.error)} />
        </div>
      )}
      <Button htmlType="submit" type="primary" loading={save.isPending} block>
        {product ? "Save changes" : "Create product"}
      </Button>
    </form>
  );
}

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
                { key: "id", label: "ID", children: detail.data.id },
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
                  children: detail.data.created_at,
                },
                {
                  key: "updated",
                  label: "Updated",
                  children: detail.data.updated_at,
                },
              ]}
            />
          ))
        )}
      </Modal>
    </div>
  );
}
