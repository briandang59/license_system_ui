"use client";

import { Alert, Button } from "antd";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type { FieldValues } from "react-hook-form";
import type { ComponentProps } from "react";
import FormSelect from "@/components/form/form-select";
import { companyService } from "@/features/companies/service";
import { getApiErrorMessage } from "@/lib/api-errors";

export default function CompanySelect<T extends FieldValues>({
  companyId,
  ...props
}: Pick<ComponentProps<typeof FormSelect<T>>, "control" | "name" | "label" | "required" | "disabled"> & { companyId?: number }) {
  const companies = useInfiniteQuery({
    queryKey: ["companies", "options"],
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => companyService.getAll(pageParam, signal),
    getNextPageParam: (page) => page.items.length === page.limit ? page.offset + page.limit : undefined,
  });
  const selected = useQuery({
    queryKey: ["companies", "detail", companyId],
    queryFn: ({ signal }) => companyService.getById(companyId!, signal),
    enabled: companyId !== undefined,
  });
  const options = new Map(
    (companies.data?.pages.flatMap((page) => page.items) ?? []).map((company) => [company.id, company]),
  );
  if (selected.data) options.set(selected.data.id, selected.data);

  return (
    <>
      <FormSelect
        {...props}
        loading={companies.isFetching || selected.isFetching}
        showSearch={{ optionFilterProp: "label" }}
        options={[...options.values()].map((company) => ({
          value: company.id,
          label: `${company.name} (${company.code})`,
        }))}
      />
      {(companies.isError || selected.isError) && (
        <div role="alert" className="mb-4">
          <Alert type="error" title={getApiErrorMessage(companies.error ?? selected.error)}
            action={<Button onClick={() => {
              if (companies.isError) void companies.refetch();
              if (selected.isError) void selected.refetch();
            }}>Tải lại doanh nghiệp</Button>} />
        </div>
      )}
      {companies.hasNextPage && (
        <Button className="mb-4" disabled={props.disabled} loading={companies.isFetchingNextPage}
          onClick={() => { if (!companies.isFetching) void companies.fetchNextPage(); }}>
          Tải thêm doanh nghiệp
        </Button>
      )}
    </>
  );
}
