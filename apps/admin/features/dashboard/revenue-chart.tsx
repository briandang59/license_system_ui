"use client";
import { useState } from "react";
import { Tooltip } from "antd";
import type { Dashboard } from "./schema";
import { formatMoneyMinor } from "./money";
export default function RevenueChart({ rows, currency, days, month }: { rows: Dashboard["daily"]; currency: string; days: number; month: string }) {
 const [selected, setSelected] = useState<string | null>(null);
 const points = Array.from({ length: days }, (_, i) => { const day = `${month}-${String(i+1).padStart(2, "0")}`; return { day, value: rows.find(r => r.day === day && r.currency === currency)?.amount_minor ?? "0" }; });
 const max = points.reduce((a, p) => BigInt(p.value) > a ? BigInt(p.value) : a, BigInt(0));
 const current = points.find(p => p.day === selected);
 return <><div className="flex h-48 items-end gap-1" role="group" aria-label="Doanh thu thực thu theo ngày">
 {points.map((p, i) => <Tooltip key={p.day} title={`${p.day}: ${formatMoneyMinor(p.value, currency)}`}><button type="button" onClick={() => setSelected(p.day)} aria-label={`${p.day}: ${formatMoneyMinor(p.value, currency)}`} aria-pressed={selected === p.day} className="flex h-full min-w-0 flex-1 flex-col justify-end rounded-sm focus-visible:outline-2 focus-visible:outline-accent"><span className="block rounded-t-sm bg-accent" style={{ height: `${max ? Math.max(2, Number(BigInt(p.value)*BigInt(10000)/max)/100) : 2}%`, opacity: selected && selected !== p.day ? 0.5 : 1 }} /><span className="mt-2 text-[10px] text-muted">{(i+1)%5 === 0 || i === 0 ? i+1 : "·"}</span></button></Tooltip>)}
 </div><p className="mt-3 min-h-6 text-sm text-muted" aria-live="polite">{current ? `${current.day}: ${formatMoneyMinor(current.value, currency)}` : "Chọn một ngày để xem số tiền thực nhận."}</p></>;
}
