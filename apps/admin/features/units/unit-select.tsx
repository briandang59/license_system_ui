"use client";
import { Alert, Button } from "antd";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type { FieldValues } from "react-hook-form";
import type { ComponentProps } from "react";
import FormSelect from "@/components/form/form-select";
import { unitService } from "@/features/units/service";
import { getApiErrorMessage } from "@/lib/api-errors";
export default function UnitSelect<T extends FieldValues>({ unitId, ...props }: Pick<ComponentProps<typeof FormSelect<T>>, "control" | "name" | "label" | "disabled" | "allowClear"> & {
    unitId?: number;
}) {
    const units = useInfiniteQuery({
        queryKey: ["units", "options"],
        initialPageParam: 0,
        queryFn: ({ pageParam, signal }) => unitService.getAll(pageParam, signal),
        getNextPageParam: (page) => page.items.length === page.limit ? page.offset + page.limit : undefined,
    });
    const selected = useQuery({
        queryKey: ["units", "detail", unitId],
        queryFn: ({ signal }) => unitService.getById(unitId!, signal),
        enabled: unitId !== undefined,
    });
    const options = new Map((units.data?.pages.flatMap((page) => page.items) ?? []).map((unit) => [unit.id, unit]));
    if (selected.data)
        options.set(selected.data.id, selected.data);
    return (<>
      <FormSelect {...props} loading={units.isFetching || selected.isFetching} showSearch={{ optionFilterProp: "label" }} options={[...options.values()].map((unit) => ({
            value: unit.id,
            label: `${unit.name} (${unit.code})`,
        }))}/>
      {(units.isError || selected.isError) && (<div role="alert" className="mb-4">
          <Alert type="error" title={getApiErrorMessage(units.error ?? selected.error)} action={<Button onClick={() => {
                    if (units.isError)
                        void units.refetch();
                    if (selected.isError)
                        void selected.refetch();
                }}>Retry units</Button>}/>
        </div>)}
      {units.hasNextPage && (<Button className="mb-4" disabled={props.disabled} loading={units.isFetchingNextPage} onClick={() => { if (!units.isFetching)
            void units.fetchNextPage(); }}>
          Load more units
        </Button>)}
    </>);
}
