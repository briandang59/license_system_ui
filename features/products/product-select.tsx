"use client";

import { Alert, Button } from "antd";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type { FieldValues } from "react-hook-form";
import type { ComponentProps } from "react";
import FormSelect from "@/components/form/form-select";
import { productService } from "@/features/products/service";
import { getApiErrorMessage } from "@/lib/api-errors";

export default function ProductSelect<T extends FieldValues>({
  productId,
  ...props
}: Pick<ComponentProps<typeof FormSelect<T>>, "control" | "name" | "label" | "disabled"> & { productId?: number }) {
  const products = useInfiniteQuery({
    queryKey: ["products", "options"],
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => productService.getAll(pageParam, signal),
    getNextPageParam: (page) => page.items.length === page.limit ? page.offset + page.limit : undefined,
  });
  const selected = useQuery({
    queryKey: ["products", "detail", productId],
    queryFn: ({ signal }) => productService.getById(productId!, signal),
    enabled: productId !== undefined,
  });
  const options = new Map(
    (products.data?.pages.flatMap((page) => page.items) ?? []).map((product) => [product.id, product]),
  );
  if (selected.data) options.set(selected.data.id, selected.data);

  return (
    <>
      <FormSelect
        {...props}
        loading={products.isFetching || selected.isFetching}
        showSearch={{ optionFilterProp: "label" }}
        options={[...options.values()].map((product) => ({
          value: product.id,
          label: `${product.name} (${product.code})`,
        }))}
      />
      {(products.isError || selected.isError) && (
        <div role="alert" className="mb-4">
          <Alert type="error" title={getApiErrorMessage(products.error ?? selected.error)}
            action={<Button onClick={() => {
              if (products.isError) void products.refetch();
              if (selected.isError) void selected.refetch();
            }}>Retry products</Button>} />
        </div>
      )}
      {products.hasNextPage && (
        <Button className="mb-4" disabled={props.disabled} loading={products.isFetchingNextPage}
          onClick={() => { if (!products.isFetching) void products.fetchNextPage(); }}>
          Load more products
        </Button>
      )}
    </>
  );
}
