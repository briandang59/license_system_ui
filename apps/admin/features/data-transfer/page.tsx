"use client";
import { useState } from "react";
import { Select } from "antd";
import DataTransferActions from "./actions";
import { exportResources, type TransferResource } from "./schema";
const label = (resource: string) => resource.split("-").join(" ");
export default function DataTransferPage() { const [resource, setResource] = useState<TransferResource>("products"); return <section><h1 className="text-2xl font-semibold">Import & export</h1><p className="mt-2 mb-6 max-w-2xl text-muted">Import catalog and pricing configuration from CSV or Excel. Export CSV for any supported business resource, including subscriptions and licenses.</p><div className="flex flex-wrap items-end gap-4"><label htmlFor="transfer-resource" className="flex flex-col gap-2">Resource<Select id="transfer-resource" style={{ width: 260 }} value={resource} onChange={setResource} options={exportResources.map(r => ({ value: r, label: label(r) }))}/></label><DataTransferActions key={resource} resource={resource}/></div><p className="mt-6 max-w-2xl text-sm text-muted">Exports include all matching records, up to 10,000 rows per file. Audit log export includes action metadata. Authentication records are excluded. Use the export buttons on individual screens to apply their filters.</p></section>; }
