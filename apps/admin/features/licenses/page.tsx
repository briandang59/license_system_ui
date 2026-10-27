import DataTransferActions from "@/features/data-transfer/actions";

export default function LicensesPage() {
  return (
    <section>
      <h1 className="text-2xl font-semibold">Bản quyền</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Xuất bản quyền và dữ liệu liên quan. Chức năng sửa bản quyền chưa được hỗ trợ. Mỗi tệp CSV chứa tối đa 10.000 bản ghi. Nhật ký chỉ xuất thông tin về thao tác.
      </p>
      <div className="mt-6 divide-y divide-line">
        {([
          ["licenses", "Bản quyền"],
          ["license-entitlements", "Quyền lợi"],
          ["license-activations", "Lượt kích hoạt"],
          ["license-audit-logs", "Nhật ký thao tác"],
        ] as const).map(([resource, label]) => (
          <div key={resource} className="flex flex-wrap items-center justify-between gap-3 py-4">
            <h2 className="font-medium">{label}</h2>
            <DataTransferActions resource={resource} exportOnly />
          </div>
        ))}
      </div>
    </section>
  );
}
