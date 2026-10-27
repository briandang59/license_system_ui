export function formatQuoteMoney(amount: number, currency: string): string {
 try {
  if (!Number.isSafeInteger(amount) || amount < 0 || !Intl.supportedValuesOf("currency").includes(currency)) throw new Error("unsupported currency");
  const formatter = new Intl.NumberFormat("en-US", { style: "currency", currency, currencyDisplay: "code" });
  return formatter.format(amount / 10 ** (formatter.resolvedOptions().maximumFractionDigits ?? 2));
 } catch { return `${amount.toLocaleString("en-US")} ${currency} đơn vị nhỏ nhất`; }
}
