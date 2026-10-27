"use client";
import { Alert, Button, Spin } from "antd";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { featureService } from "./service";
export default function FeatureContext({ id, children }: {
    id?: number;
    children: (feature: {
        name: string;
        feature_type: string;
    }) => ReactNode;
}) {
    const query = useQuery({ queryKey: ["features", "detail", id], queryFn: ({ signal }) => featureService.getById(id!, signal), enabled: !!id });
    if (!id)
        return null;
    if (query.isPending)
        return <Spin aria-label="Đang tải tính năng"/>;
    if (query.isError)
        return <Alert type="error" title="Không thể tải tính năng" action={<Button onClick={() => void query.refetch()}>Thử lại</Button>}/>;
    return <>{children(query.data)}</>;
}
