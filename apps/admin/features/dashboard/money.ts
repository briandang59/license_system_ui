export function formatMoneyMinor(value: string, currency: string): string {
 const digits = new Intl.NumberFormat("vi-VN", { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
 const amount = BigInt(value); const scale = BigInt(10) ** BigInt(digits);
 const major = new Intl.NumberFormat("vi-VN").format(amount / scale);
 return `${major}${digits ? `,${(amount % scale).toString().padStart(digits, "0")}` : ""} ${currency}`;
}
