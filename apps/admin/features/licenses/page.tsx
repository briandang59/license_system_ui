"use client";
import { useState } from "react";
import { Alert, Button, Collapse, Select, Table } from "antd";
import { useQuery } from "@tanstack/react-query";
import DataTransferActions from "@/features/data-transfer/actions";
import PageHeader from "@/components/ui/page-header";
import SearchField from "@/components/ui/search-field";
import { getApiErrorMessage } from "@/lib/api-errors";
import { licenseService } from "./service";
import { licenseColumns, licenseLabels } from "./columns";
export default function LicensesPage() {
 const [search, setSearch] = useState(""); const [status, setStatus] = useState(""); const [offset, setOffset] = useState(0); const [selected, setSelected] = useState<React.Key[]>([]);
 const query = useQuery({ queryKey: ["licenses", offset, search, status], queryFn: ({ signal }) => licenseService.list(offset, search, status, signal) });
 return <><PageHeader title="Bản quyền" description="Tra cứu bản quyền theo doanh nghiệp, sản phẩm và thiết bị đã kích hoạt." actions={<DataTransferActions resource="licenses" exportOnly />} />
 <div className="mb-6 flex flex-wrap items-center gap-3"><SearchField label="Tìm bản quyền" placeholder="Doanh nghiệp, mã số thuế, email, sản phẩm, thiết bị…" onSearch={v => { setSearch(v); setOffset(0); setSelected([]); }} /><Select aria-label="Trạng thái bản quyền" style={{ minWidth: 190 }} value={status} onChange={v => { setStatus(v); setOffset(0); setSelected([]); }} options={[{ value: "", label: "Tất cả trạng thái" }, ...Object.entries(licenseLabels).map(([value, label]) => ({ value, label }))]} /></div>
 {query.isError && <Alert type="error" title={getApiErrorMessage(query.error)} action={<Button onClick={() => void query.refetch()}>Thử lại</Button>} />}
 <Table rowKey="id" loading={query.isFetching} columns={licenseColumns(offset)} dataSource={query.data?.items ?? []} pagination={false} rowSelection={{ selectedRowKeys: selected, onChange: setSelected }} scroll={{ x: 1100 }} />
 <div className="my-4 flex justify-end gap-3"><Button disabled={!offset || query.isFetching} onClick={() => { setOffset(offset-20); setSelected([]); }}>Trước</Button><Button disabled={query.isFetching || query.isError || (query.data?.items.length ?? 0) < 20} onClick={() => { setOffset(offset+20); setSelected([]); }}>Tiếp</Button></div>
 <Collapse className="mt-6" items={[{ key: "exports", label: "Xuất dữ liệu liên quan", children: <div className="divide-y divide-line">{([["license-entitlements", "Quyền lợi"], ["license-activations", "Lượt kích hoạt"], ["license-audit-logs", "Nhật ký thao tác"]] as const).map(([resource, label]) => <div key={resource} className="flex flex-wrap items-center justify-between gap-3 py-4"><span>{label}</span><DataTransferActions resource={resource} exportOnly /></div>)}<p className="py-4 text-sm text-muted">Mỗi tệp tối đa 10.000 bản ghi. Nhật ký chỉ xuất thông tin thao tác.</p></div> }]} />
 </>;
}
