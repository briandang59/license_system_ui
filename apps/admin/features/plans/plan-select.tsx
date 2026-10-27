"use client";

import { Alert, Button } from "antd";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type { FieldValues } from "react-hook-form";
import type { ComponentProps } from "react";
import FormSelect from "@/components/form/form-select";
import { planService } from "@/features/plans/service";
import { getApiErrorMessage } from "@/lib/api-errors";

export default function PlanSelect<T extends FieldValues>({
  planId,
  ...props
}: Pick<ComponentProps<typeof FormSelect<T>>, "control" | "name" | "label" | "disabled"> & { planId?: number }) {
  const plans = useInfiniteQuery({
    queryKey: ["plans", "options"],
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => planService.getAll(pageParam, signal),
    getNextPageParam: (page) => page.items.length === page.limit ? page.offset + page.limit : undefined,
  });
  const selected = useQuery({
    queryKey: ["plans", "detail", planId],
    queryFn: ({ signal }) => planService.getById(planId!, signal),
    enabled: planId !== undefined,
  });
  const options = new Map(
    (plans.data?.pages.flatMap((page) => page.items) ?? []).map((plan) => [plan.id, plan]),
  );
  if (selected.data) options.set(selected.data.id, selected.data);

  return (
    <>
      <FormSelect
        {...props}
        loading={plans.isFetching || selected.isFetching}
        showSearch={{ optionFilterProp: "label" }}
        options={[...options.values()].map((plan) => ({
          value: plan.id,
          label: `${plan.name} (${plan.code})`,
        }))}
      />
      {(plans.isError || selected.isError) && (
        <div role="alert" className="mb-4">
          <Alert type="error" title={getApiErrorMessage(plans.error ?? selected.error)}
            action={<Button onClick={() => {
              if (plans.isError) void plans.refetch();
              if (selected.isError) void selected.refetch();
            }}>Tải lại gói dịch vụ</Button>} />
        </div>
      )}
      {plans.hasNextPage && (
        <Button className="mb-4" disabled={props.disabled} loading={plans.isFetchingNextPage}
          onClick={() => { if (!plans.isFetching) void plans.fetchNextPage(); }}>
          Tải thêm gói dịch vụ
        </Button>
      )}
    </>
  );
}
