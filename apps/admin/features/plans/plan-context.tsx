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
        return <Spin aria-label="Đang tải gói dịch vụ"/>;
    if (query.isError)
        return <Alert type="error" title="Không thể tải gói dịch vụ" action={<Button onClick={() => void query.refetch()}>Thử lại</Button>}/>;
    return <>{children(query.data)}</>;
}
