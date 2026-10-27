"use client";

import { Alert, Button } from "antd";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type { FieldValues } from "react-hook-form";
import type { ComponentProps } from "react";
import FormSelect from "@/components/form/form-select";
import { featureService } from "@/features/features/service";
import { getApiErrorMessage } from "@/lib/api-errors";

export default function FeatureSelect<T extends FieldValues>({
  featureId,
  productId,
  ...props
}: Pick<ComponentProps<typeof FormSelect<T>>, "control" | "name" | "label" | "disabled"> & { featureId?: number; productId?: number }) {
  const features = useInfiniteQuery({
    queryKey: ["features", "options"],
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => featureService.getAll(pageParam, signal),
    getNextPageParam: (page) => page.items.length === page.limit ? page.offset + page.limit : undefined,
  });
  const selected = useQuery({
    queryKey: ["features", "detail", featureId],
    queryFn: ({ signal }) => featureService.getById(featureId!, signal),
    enabled: featureId !== undefined,
  });
  const options = new Map(
    (features.data?.pages.flatMap((page) => page.items) ?? []).map((feature) => [feature.id, feature]),
  );
  if (selected.data) options.set(selected.data.id, selected.data);

  return (
    <>
      <FormSelect
        {...props}
        loading={features.isFetching || selected.isFetching}
        showSearch={{ optionFilterProp: "label" }}
        options={[...options.values()].map((feature) => ({
          value: feature.id,
          disabled: productId !== undefined && feature.product_id !== productId,
          label: `${feature.name} (${feature.code})`,
        }))}
      />
      {(features.isError || selected.isError) && (
        <div role="alert" className="mb-4">
          <Alert type="error" title={getApiErrorMessage(features.error ?? selected.error)}
            action={<Button onClick={() => {
              if (features.isError) void features.refetch();
              if (selected.isError) void selected.refetch();
            }}>Tải lại tính năng</Button>} />
        </div>
      )}
      {features.hasNextPage && (
        <Button className="mb-4" disabled={props.disabled} loading={features.isFetchingNextPage}
          onClick={() => { if (!features.isFetching) void features.fetchNextPage(); }}>
          Tải thêm tính năng
        </Button>
      )}
    </>
  );
}
