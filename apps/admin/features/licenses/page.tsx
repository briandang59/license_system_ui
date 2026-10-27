import DataTransferActions from "@/features/data-transfer/actions";

export default function LicensesPage() {
  return (
    <section>
      <h1 className="text-2xl font-semibold">Licenses</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Export licenses and related records. License editing is not available yet.
        Each CSV includes up to 10,000 records. Audit logs include action metadata only.
      </p>
      <div className="mt-6 divide-y divide-line">
        {([
          ["licenses", "Licenses"],
          ["license-entitlements", "Entitlements"],
          ["license-activations", "Activations"],
          ["license-audit-logs", "Audit logs"],
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
