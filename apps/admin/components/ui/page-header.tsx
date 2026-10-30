import type { ReactNode } from "react";
export default function PageHeader({ title, description, actions }: { title: string; description: string; actions?: ReactNode }) {
 return <header className="mb-6 flex flex-wrap items-start justify-between gap-4"><div className="min-w-0"><h1 className="text-2xl font-semibold tracking-tight">{title}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{description}</p></div>{actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}</header>;
}
