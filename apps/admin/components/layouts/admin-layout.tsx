"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, Button, Drawer, Menu } from "antd";
import { Building2, CalendarCheck, ChevronRight, Layers3, LayoutDashboard, LogOut, Menu as MenuIcon, Package, Puzzle, Ruler, ShieldCheck } from "lucide-react";
import ThemeSwitcher from "@/components/ui/theme-switcher";
import { useLogout } from "@/features/auth/use-logout";
import { displayLabel } from "@/lib/display-labels";

const items = [
  { key: "/", icon: <LayoutDashboard size={17} aria-hidden="true" />, label: <Link href="/">Tổng quan</Link> },
  { key: "operations", label: "Nghiệp vụ", type: "group" as const, children: [
    { key: "/registrations", icon: <CalendarCheck size={17} aria-hidden="true" />, label: <Link href="/registrations">Yêu cầu & báo giá</Link> },
    { key: "/subscriptions", icon: <CalendarCheck size={17} aria-hidden="true" />, label: <Link href="/subscriptions">Đăng ký dịch vụ</Link> },
    { key: "/payments", icon: <CalendarCheck size={17} aria-hidden="true" />, label: <Link href="/payments">Thanh toán</Link> },
    { key: "/licenses", icon: <ShieldCheck size={17} aria-hidden="true" />, label: <Link href="/licenses">Bản quyền</Link> },
    { key: "/features", icon: <Puzzle size={17} aria-hidden="true" />, label: <Link href="/features">Tính năng</Link> },
  ] },
  { key: "catalogs", label: "Danh mục", type: "group" as const, children: [
    { key: "/products", icon: <Package size={17} aria-hidden="true" />, label: <Link href="/products">Sản phẩm</Link> },
    { key: "/companies", icon: <Building2 size={17} aria-hidden="true" />, label: <Link href="/companies">Doanh nghiệp</Link> },
    { key: "/plans", icon: <Layers3 size={17} aria-hidden="true" />, label: <Link href="/plans">Gói dịch vụ</Link> },
    { key: "/units", icon: <Ruler size={17} aria-hidden="true" />, label: <Link href="/units">Đơn vị tính</Link> },
  ] },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const logout = useLogout();
  const [menuOpen, setMenuOpen] = useState(false);
  const pageTitle = pathname === "/" ? "Tổng quan" : displayLabel(pathname.split("/")[1]);
  const navigation = (
    <nav aria-label="Điều hướng chính">
      <div className="flex h-20 items-center gap-3 px-6 font-semibold tracking-tight text-foreground">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-accent">
          <ShieldCheck size={21} aria-hidden="true" />
        </span>
        Hệ thống bản quyền
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
        Chuyển đến nội dung
      </a>
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-line bg-surface lg:flex">
        {navigation}
        <div className="mx-6 mt-auto border-t border-line py-5 text-xs text-muted">Không gian quản lý bản quyền</div>
      </aside>
      <Drawer
        title="Điều hướng"
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
                aria-label="Mở menu điều hướng"
                aria-expanded={menuOpen}
                icon={<MenuIcon size={17} aria-hidden="true" />}
              >
              </Button>
            </div>
            <div className="hidden items-center gap-3 text-sm sm:flex">
              <span className="text-muted">Hệ thống quản lý</span><ChevronRight size={14} className="text-muted" aria-hidden="true" />
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
              aria-label="Đăng xuất" title="Đăng xuất"
              onClick={() => {
                if (!logout.isPending) logout.mutate();
              }}
            >
              <span className="hidden sm:inline">Đăng xuất</span>
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
