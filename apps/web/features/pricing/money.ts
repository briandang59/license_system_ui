export function formatMoney(amountMinor: number, currency: string) {
    if (!Number.isSafeInteger(amountMinor) || amountMinor < 0)
        return "Chưa có giá";
    try {
        if (!Intl.supportedValuesOf("currency").includes(currency))
            return `${amountMinor.toLocaleString("en-US")} ${currency} đơn vị nhỏ nhất`;
        const format = new Intl.NumberFormat("en-US", { style: "currency", currency, currencyDisplay: "code" });
        const digits = format.resolvedOptions().maximumFractionDigits ?? 2;
        return format.format(amountMinor / 10 ** digits);
    }
    catch {
        return `${amountMinor.toLocaleString("en-US")} ${currency} đơn vị nhỏ nhất`;
    }
}
