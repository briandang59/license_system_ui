"use client";
import { useQuery } from "@tanstack/react-query";
import { unitService } from "./service";
export default function UnitLabel({ id, fallback }: {
    id?: number | null;
    fallback?: string | null;
}) {
    const unit = useQuery({ queryKey: ["units", "detail", id], queryFn: ({ signal }) => unitService.getById(id!, signal), enabled: !!id });
    return <>{unit.data?.symbol || unit.data?.name || fallback || "Chưa thiết lập"}</>;
}
