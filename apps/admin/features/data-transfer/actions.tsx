"use client";
import { displayLabel } from "@/lib/display-labels";
import { importRowMessage } from "./messages";
import { useState } from "react";
import { Alert, App, Button, Modal, Space, Table, type UploadFile } from "antd";
import { Download, Upload } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
z.config(z.locales.vi());
import FormUpload from "@/components/form/form-upload";
import { getApiErrorMessage } from "@/lib/api-errors";
import { downloadFile, importFile, saveBlob } from "./service";
import { importResources, maxFileBytes, type TransferResource, type ImportResult } from "./schema";
const formSchema = z.object({ files: z.array(z.custom<UploadFile>()).length(1, "Chọn một tệp").refine(files => files.every(f => !!f.originFileObj && f.size !== undefined && f.size > 0 && f.size <= maxFileBytes && /\.(csv|xlsx)$/i.test(f.name)), "Chọn tệp CSV/XLSX không quá 2 MiB") });
function errorCSV(rows: ImportResult["rows"]) { const cell = (v: string) => `"${(/^[\s]*[=+\-@]/.test(v) ? "'" + v : v).replaceAll('"', '""')}"`; const lines = [["row", "code", "message"], ...rows.filter(r => r.action === "error").map(r => [String(r.row), r.code, importRowMessage(r)])]; return "\ufeff" + lines.map(row => row.map(cell).join(",")).join("\r\n"); }
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
            void message.success(`Đã nhập: ${result.created} tạo mới, ${result.updated} cập nhật.`);
            await Promise.all([client.invalidateQueries({ queryKey: ["products"] }), client.invalidateQueries({ queryKey: ["companies"] }), client.invalidateQueries({ queryKey: ["units"] }), client.invalidateQueries({ queryKey: ["features"] }), client.invalidateQueries({ queryKey: ["plans"] }), client.invalidateQueries({ queryKey: ["prices"] })]);
        } } });
    const busy = preview.isPending || commit.isPending;
    const current = report && checkedFile === file;
    function close() { if (busy)
        return; setOpen(false); setReport(null); setCheckedFile(null); reset({ files: [] }); }
    return <><Space wrap>{canImport && <Button icon={<Upload size={16} aria-hidden/>} onClick={() => setOpen(true)}>Nhập dữ liệu</Button>}<Button icon={<Download size={16} aria-hidden/>} loading={download.isPending} onClick={() => { if (!download.isPending)
        download.mutate({ action: "export" }); }}>Xuất CSV</Button></Space><Modal title="Nhập dữ liệu" width={900} open={open} onCancel={close} closable={!busy} keyboard={!busy} mask={{ closable: !busy }} footer={null} destroyOnHidden><p className="mb-4 text-muted">Nhập tối đa 500 dòng, tạo mới hoặc cập nhật theo mã và sản phẩm tương ứng. Ô trống sẽ xóa giá trị cho phép để trống; cột không có trong tệp được giữ nguyên. Nếu có lỗi, toàn bộ tệp sẽ không được lưu.</p>{(resource === "plan-prices" || resource === "feature-prices") && <Alert type="info" className="mb-4" title="Giữ nguyên lịch sử giá" description="Dùng price_id để cập nhật ngày kết thúc hoặc trạng thái. Để trống price_id để tạo giá mới; không thể ghi đè số tiền của giá hiện có."/>}<Space wrap className="mb-4"><Button disabled={busy || download.isPending} onClick={() => download.mutate({ action: "template", format: "csv" })}>Tệp mẫu CSV</Button><Button disabled={busy || download.isPending} onClick={() => download.mutate({ action: "template", format: "xlsx" })}>Tệp mẫu Excel</Button></Space><form noValidate onSubmit={handleSubmit(v => { const f = v.files[0].originFileObj; if (f && !busy) {
        setReport(null);
        preview.mutate(f);
    } })}><FormUpload control={control} name="files" label="Tệp dữ liệu" accept=".csv,.xlsx" maxCount={1} disabled={busy}/><Button htmlType="submit" loading={preview.isPending} disabled={busy || !!(current && report.committed)}>Kiểm tra tệp</Button></form>{current && <div className="mt-5"><Alert type={report.committed ? "success" : report.valid ? "info" : "error"} title={report.committed ? "Nhập dữ liệu thành công" : report.valid ? `${report.created} dòng tạo mới, ${report.updated} dòng cập nhật` : "Chưa lưu dữ liệu. Hãy sửa các dòng có lỗi và kiểm tra lại tệp."}/><Table size="small" className="mt-4" rowKey="row" dataSource={report.rows} pagination={{ pageSize: 10 }} scroll={{ x: 600 }} columns={[{ title: "Dòng trong tệp", dataIndex: "row", width: 90 }, { title: "Bản ghi", dataIndex: "label" }, { title: "Thao tác", dataIndex: "action", width: 110, render: (value: string) => displayLabel(value) }, { title: "Lỗi", dataIndex: "message", render: (_, row) => importRowMessage(row) }]}/><div className="mt-4 flex flex-wrap justify-end gap-2">{!report.valid && <Button onClick={() => saveBlob(new Blob([errorCSV(report.rows)], { type: "text/csv;charset=utf-8" }), `${resource}-errors.csv`)}>Tải danh sách lỗi</Button>}<Button type="primary" disabled={!report.valid || report.committed || busy} loading={commit.isPending} onClick={() => { if (!busy && file === checkedFile)
        commit.mutate(); }}>Xác nhận nhập</Button></div></div>}</Modal></>;
}
