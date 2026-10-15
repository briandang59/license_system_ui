"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Alert, Avatar, Button, Drawer, Menu } from "antd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/services/auth.service";
import { getApiErrorMessage } from "@/lib/api-errors";

const items = [
  { key: "/", label: <Link href="/">Overview</Link> },
  {
    key: "catalogs",
    label: "Catalog management",
    children: [
      { key: "licenses", label: "Licenses", disabled: false },
      { key: "products", label: "Products", disabled: false },
      { key: "customers", label: "Customers", disabled: false },
    ],
  },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const logout = useMutation({
    mutationFn: authService.logout,
    retry: false,
    onSuccess: async () => {
      await queryClient.cancelQueries();
      queryClient.clear();
      router.replace("/auth/login");
      router.refresh();
    },
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const navigation = (
    <nav aria-label="Main navigation">
      <div className="flex h-20 items-center gap-3 px-6 font-semibold tracking-tight text-slate-900">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-sm text-white">
          LS
        </span>
        License System
      </div>
      <p className="px-6 pb-3 pt-5 text-xs font-medium uppercase tracking-widest text-slate-400">
        Workspace
      </p>
      <Menu
        mode="inline"
        selectedKeys={[pathname]}
        defaultOpenKeys={["catalogs"]}
        items={items}
        onClick={() => setMenuOpen(false)}
        style={{ borderInlineEnd: 0 }}
      />
      <p className="px-6 pt-6 text-xs leading-5 text-slate-400">
        More catalog pages will be available as your workspace grows.
      </p>
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:bg-white focus:p-3"
      >
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white lg:block">
        {navigation}
      </aside>
      <Drawer
        title="Navigation"
        placement="left"
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      >
        {navigation}
      </Drawer>
      <div className="lg:pl-64">
        <header className="flex h-20 items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="lg:hidden">
              <Button
                onClick={() => setMenuOpen(true)}
                aria-label="Open navigation"
                aria-expanded={menuOpen}
              >
                Menu
              </Button>
            </div>
            <span className="text-sm font-medium text-slate-500">
              Management workspace
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 sm:inline">
              Your workspace
            </span>
            <Avatar style={{ backgroundColor: "#dbeafe", color: "#1d4ed8" }}>
              LS
            </Avatar>
            <Button loading={logout.isPending} onClick={() => { if (!logout.isPending) logout.mutate(); }}>
              Sign out
            </Button>
          </div>
        </header>
        <main id="main-content" className="mx-auto max-w-7xl p-5 sm:p-8">
          {logout.isError && <div role="alert" className="mb-5"><Alert type="error" showIcon title={getApiErrorMessage(logout.error)} /></div>}
          {children}
        </main>
      </div>
    </div>
  );
}
