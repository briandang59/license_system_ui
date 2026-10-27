"use client";
import { Alert, Button, Spin } from "antd";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { planService } from "./service";
export default function PlanContext({ id, children }: {
    id: number;
    children: (plan: {
        product_id: number;
        name: string;
    }) => ReactNode;
}) {
    const query = useQuery({ queryKey: ["plans", "detail", id], queryFn: ({ signal }) => planService.getById(id, signal) });
    if (query.isPending)
        return <Spin aria-label="Loading plan"/>;
    if (query.isError)
        return <Alert type="error" title="Could not load plan" action={<Button onClick={() => void query.refetch()}>Retry</Button>}/>;
    return <>{children(query.data)}</>;
}
