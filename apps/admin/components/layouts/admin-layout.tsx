"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, Button, Drawer, Menu } from "antd";
import { Building2, CalendarCheck, ChevronRight, Layers3, LayoutDashboard, LogOut, Menu as MenuIcon, Package, Puzzle, Ruler, ShieldCheck } from "lucide-react";
import ThemeSwitcher from "@/components/ui/theme-switcher";
import { useLogout } from "@/features/auth/use-logout";

const items = [
  { key: "/", icon: <LayoutDashboard size={17} aria-hidden="true" />, label: <Link href="/">Overview</Link> },
  {
    key: "catalogs",
    label: "Catalogs",
    type: "group" as const,
    children: [
      { key: "/licenses", icon: <ShieldCheck size={17} aria-hidden="true" />, label: <Link href="/licenses">Licenses</Link> },
      { key: "/products", icon: <Package size={17} aria-hidden="true" />, label: <Link href="/products">Products</Link> },
      { key: "/companies", icon: <Building2 size={17} aria-hidden="true" />, label: <Link href="/companies">Companies</Link> },
      { key: "/plans", icon: <Layers3 size={17} aria-hidden="true" />, label: <Link href="/plans">Plans</Link> },
      { key: "/units", icon: <Ruler size={17} aria-hidden="true" />, label: <Link href="/units">Units</Link> },
      { key: "/subscriptions", icon: <CalendarCheck size={17} aria-hidden="true" />, label: <Link href="/subscriptions">Subscriptions</Link> },
      { key: "/features", icon: <Puzzle size={17} aria-hidden="true" />, label: <Link href="/features">Features</Link> },
    ],
  },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const logout = useLogout();
  const [menuOpen, setMenuOpen] = useState(false);
  const pageTitle = pathname === "/" ? "Overview" : pathname.split("/")[1];
  const navigation = (
    <nav aria-label="Main navigation">
      <div className="flex h-20 items-center gap-3 px-6 font-semibold tracking-tight text-foreground">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-accent">
          <ShieldCheck size={21} aria-hidden="true" />
        </span>
        License System
      </div>
      <Menu
        mode="inline"
        selectedKeys={[pathname]}
        items={items}
        onClick={() => setMenuOpen(false)}
        style={{ borderInlineEnd: 0 }}
      />
    </nav>
  );

  return (
    <div className="min-h-screen bg-canvas text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:bg-surface focus:p-3"
      >
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-line bg-surface lg:flex">
        {navigation}
        <div className="mx-6 mt-auto border-t border-line py-5 text-xs text-muted">License management workspace</div>
      </aside>
      <Drawer
        title="Navigation"
        placement="left"
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      >
        {navigation}
      </Drawer>
      <div className="lg:pl-60">
        <header className="flex h-16 items-center justify-between gap-3 border-b border-line bg-surface px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="lg:hidden">
              <Button
                onClick={() => setMenuOpen(true)}
                aria-label="Open navigation"
                aria-expanded={menuOpen}
                icon={<MenuIcon size={17} aria-hidden="true" />}
              >
              </Button>
            </div>
            <div className="hidden items-center gap-3 text-sm sm:flex">
              <span className="text-muted">Workspace</span><ChevronRight size={14} className="text-muted" aria-hidden="true" />
              <span className="font-medium capitalize">{pageTitle}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <Avatar style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent)" }}>
              LS
            </Avatar>
            <Button
              loading={logout.isPending}
              icon={<LogOut size={16} aria-hidden="true" />}
              aria-label="Sign out" title="Sign out"
              onClick={() => {
                if (!logout.isPending) logout.mutate();
              }}
            >
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </header>
        <main id="main-content" className="mx-auto max-w-[1600px] p-4 sm:p-8">
          <div className="rounded-xl border border-line bg-surface p-4 sm:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
