"use client";
import { useState } from "react";
import { Alert, App, Button, Modal, Space, Table, type UploadFile } from "antd";
import { Download, Upload } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import FormUpload from "@/components/form/form-upload";
import { getApiErrorMessage } from "@/lib/api-errors";
import { downloadFile, importFile, saveBlob } from "./service";
import { importResources, maxFileBytes, type TransferResource, type ImportResult } from "./schema";
const formSchema = z.object({ files: z.array(z.custom<UploadFile>()).length(1, "Choose one file").refine(files => files.every(f => !!f.originFileObj && f.size !== undefined && f.size > 0 && f.size <= maxFileBytes && /\.(csv|xlsx)$/i.test(f.name)), "Choose a CSV/XLSX file up to 2 MiB") });
function errorCSV(rows: ImportResult["rows"]) { const cell = (v: string) => `"${(/^[\s]*[=+\-@]/.test(v) ? "'" + v : v).replaceAll('"', '""')}"`; const lines = [["row", "code", "message"], ...rows.filter(r => r.action === "error").map(r => [String(r.row), r.code, r.message])]; return "\ufeff" + lines.map(row => row.map(cell).join(",")).join("\r\n"); }
export default function DataTransferActions({ resource, filters = {}, parentId, exportOnly = false }: {
    resource: TransferResource;
    filters?: Record<string, string>;
    parentId?: number;
    exportOnly?: boolean;
}) {
    const { message } = App.useApp();
    const client = useQueryClient();
    const [open, setOpen] = useState(false);
    const [report, setReport] = useState<ImportResult | null>(null);
    const [checkedFile, setCheckedFile] = useState<File | null>(null);
    const { control, handleSubmit, reset } = useForm<z.infer<typeof formSchema>>({ resolver: zodResolver(formSchema), defaultValues: { files: [] } });
    const files = useWatch({ control, name: "files" });
    const file = files[0]?.originFileObj;
    const canImport = !exportOnly && importResources.some(r => r === resource);
    const download = useMutation({ mutationFn: ({ action, format }: {
            action: "template" | "export";
            format?: string;
        }) => downloadFile(resource, action, action === "template" ? { format: format ?? "csv" } : filters), onError: e => void message.error(getApiErrorMessage(e)) });
    const preview = useMutation({ mutationFn: (f: File) => importFile(resource, f, parentId), onError: e => void message.error(getApiErrorMessage(e)), onSuccess: (result, f) => { setReport(result); setCheckedFile(f); } });
    const commit = useMutation({ mutationFn: () => importFile(resource, file!, parentId, report!.fingerprint), onError: e => void message.error(getApiErrorMessage(e)), onSuccess: async (result) => { setReport(result); if (result.committed) {
            void message.success(`Imported: ${result.created} created, ${result.updated} updated.`);
            await Promise.all([client.invalidateQueries({ queryKey: ["products"] }), client.invalidateQueries({ queryKey: ["companies"] }), client.invalidateQueries({ queryKey: ["units"] }), client.invalidateQueries({ queryKey: ["features"] }), client.invalidateQueries({ queryKey: ["plans"] }), client.invalidateQueries({ queryKey: ["prices"] })]);
        } } });
    const busy = preview.isPending || commit.isPending;
    const current = report && checkedFile === file;
    function close() { if (busy)
        return; setOpen(false); setReport(null); setCheckedFile(null); reset({ files: [] }); }
    return <><Space wrap>{canImport && <Button icon={<Upload size={16} aria-hidden/>} onClick={() => setOpen(true)}>Import</Button>}<Button icon={<Download size={16} aria-hidden/>} loading={download.isPending} onClick={() => { if (!download.isPending)
        download.mutate({ action: "export" }); }}>Export CSV</Button></Space><Modal title="Import data" width={900} open={open} onCancel={close} closable={!busy} keyboard={!busy} mask={{ closable: !busy }} footer={null} destroyOnHidden><p className="mb-4 text-muted">Upsert up to 500 rows. Existing records match by code and product where applicable. Blank optional cells clear nullable values; omitted columns stay unchanged. Any error rolls back the whole file.</p>{(resource === "plan-prices" || resource === "feature-prices") && <Alert type="info" className="mb-4" title="Price history is preserved" description="Use price_id to update end date or status. Leave price_id empty to create a new price; existing amounts cannot be overwritten."/>}<Space wrap className="mb-4"><Button disabled={busy || download.isPending} onClick={() => download.mutate({ action: "template", format: "csv" })}>CSV template</Button><Button disabled={busy || download.isPending} onClick={() => download.mutate({ action: "template", format: "xlsx" })}>Excel template</Button></Space><form noValidate onSubmit={handleSubmit(v => { const f = v.files[0].originFileObj; if (f && !busy) {
        setReport(null);
        preview.mutate(f);
    } })}><FormUpload control={control} name="files" label="Import file" accept=".csv,.xlsx" maxCount={1} disabled={busy}/><Button htmlType="submit" loading={preview.isPending} disabled={busy || !!(current && report.committed)}>Check file</Button></form>{current && <div className="mt-5"><Alert type={report.committed ? "success" : report.valid ? "info" : "error"} title={report.committed ? "Import completed" : report.valid ? `${report.created} to create, ${report.updated} to update` : "Nothing saved. Fix the reported rows and check the file again."}/><Table size="small" className="mt-4" rowKey="row" dataSource={report.rows} pagination={{ pageSize: 10 }} scroll={{ x: 600 }} columns={[{ title: "File row", dataIndex: "row", width: 90 }, { title: "Record", dataIndex: "label" }, { title: "Action", dataIndex: "action", width: 110 }, { title: "Error", dataIndex: "message" }]}/><div className="mt-4 flex flex-wrap justify-end gap-2">{!report.valid && <Button onClick={() => saveBlob(new Blob([errorCSV(report.rows)], { type: "text/csv;charset=utf-8" }), `${resource}-errors.csv`)}>Download errors</Button>}<Button type="primary" disabled={!report.valid || report.committed || busy} loading={commit.isPending} onClick={() => { if (!busy && file === checkedFile)
        commit.mutate(); }}>Confirm import</Button></div></div>}</Modal></>;
}
