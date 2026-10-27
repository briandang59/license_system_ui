import type { ReactNode } from "react";
import AdminLayout from "@/components/layouts/admin-layout";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
