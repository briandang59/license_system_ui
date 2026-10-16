import Image from "next/image";
import type { ReactNode } from "react";
import ThemeSwitcher from "@/components/ui/theme-switcher";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-screen bg-surface text-foreground lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between overflow-hidden border-r border-line bg-surface-subtle px-7 py-8 text-foreground sm:px-12 lg:flex lg:p-14">
        <div className="flex items-center gap-3 font-semibold tracking-tight"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-sm text-accent">LS</span>License System</div>
        <div className="mx-auto w-full max-w-lg py-10 lg:py-12">
          <p className="mb-4 text-sm font-medium text-accent">One workspace. Full control.</p>
          <h2 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">Your licenses.<br />Beautifully organized.</h2>
          <p className="mt-5 max-w-sm text-sm leading-7 text-muted">Bring your licenses, products, and customers together in one focused workspace.</p>
          <Image src="/auth-workspace.svg" alt="Illustration of an organized license management workspace" width={640} height={400} className="mt-8 hidden h-auto w-full sm:block" preload />
        </div>
        <p className="text-xs text-muted">Less complexity. More clarity.</p>
      </section>
      <section className="relative flex items-center justify-center px-6 py-20 sm:px-12">
        <div className="absolute top-6 right-6"><ThemeSwitcher /></div>
        <div className="w-full max-w-sm">{children}<p className="mt-10 text-center text-xs text-muted">License management, all in one place.</p></div>
      </section>
    </main>
  );
}
