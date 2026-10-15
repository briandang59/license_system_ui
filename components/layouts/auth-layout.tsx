import Image from "next/image";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-screen bg-white text-slate-900 lg:grid-cols-2">
      <section className="relative flex flex-col justify-between overflow-hidden bg-slate-950 px-7 py-8 text-white sm:px-12 lg:p-14">
        <div className="flex items-center gap-3 font-semibold tracking-tight"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-sm">LS</span>License System</div>
        <div className="mx-auto w-full max-w-lg py-10 lg:py-12">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">One workspace. Full control.</p>
          <h2 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">Your licenses.<br />Beautifully organized.</h2>
          <p className="mt-5 max-w-sm text-sm leading-7 text-slate-300">Bring your licenses, products, and customers together in one focused workspace.</p>
          <Image src="/auth-workspace.svg" alt="Illustration of an organized license management workspace" width={640} height={400} className="mt-8 hidden h-auto w-full sm:block" preload />
        </div>
        <p className="text-xs text-slate-400">Less complexity. More clarity.</p>
      </section>
      <section className="flex items-center justify-center px-6 py-14 sm:px-12">
        <div className="w-full max-w-sm">{children}<p className="mt-10 text-center text-xs text-slate-400">License management, all in one place.</p></div>
      </section>
    </main>
  );
}
