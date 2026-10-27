"use client";
import { Alert, Button } from "antd";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { ComponentProps } from "react";
import type { FieldValues } from "react-hook-form";
import FormSelect from "@/components/form/form-select";
import { priceService } from "./service";
export default function PriceSelect<T extends FieldValues>({ kind, parent, startDate, currency, interval, ...props }: Pick<ComponentProps<typeof FormSelect<T>>, "control" | "name" | "label" | "disabled" | "allowClear"> & {
    kind: "plans" | "features";
    parent?: number;
    startDate: string;
    currency?: string | null;
    interval?: string | null;
}) {
    const prices = useInfiniteQuery({ queryKey: ["prices", kind, parent], initialPageParam: 0, enabled: !!parent, queryFn: ({ pageParam, signal }) => priceService.list(kind, parent!, pageParam, signal), getNextPageParam: p => p.items.length === p.limit ? p.offset + p.limit : undefined });
    const at = Date.parse(startDate);
    const cycle = interval === "monthly" ? "month" : interval === "yearly" ? "year" : interval;
    const rows = (prices.data?.pages.flatMap(p => p.items) ?? []).filter(p => p.status === "active" && Date.parse(p.effective_from) <= at && (!p.effective_to || at < Date.parse(p.effective_to)) && (!currency || p.currency === currency) && (!cycle || p.billing_interval === cycle));
    return <><FormSelect {...props} disabled={props.disabled || !parent} loading={prices.isFetching} options={rows.map(p => ({ value: p.id, label: `${p.amount_minor} ${p.currency} minor units / ${p.billing_interval}` }))}/>{prices.isError && <Alert type="error" title="Could not load prices" action={<Button onClick={() => void prices.refetch()}>Retry</Button>}/>} {prices.hasNextPage && <Button disabled={props.disabled} loading={prices.isFetchingNextPage} onClick={() => void prices.fetchNextPage()}>Load more prices</Button>}</>;
}
