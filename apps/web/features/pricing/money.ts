export function formatMoney(amountMinor: number, currency: string) {
    if (!Number.isSafeInteger(amountMinor) || amountMinor < 0)
        return "Chưa có giá";
    try {
        if (!Intl.supportedValuesOf("currency").includes(currency))
            return `${amountMinor} ${currency} đơn vị nhỏ nhất`;
        const format = new Intl.NumberFormat("vi-VN", { style: "currency", currency });
        const digits = format.resolvedOptions().maximumFractionDigits ?? 2;
        return format.format(amountMinor / 10 ** digits);
    }
    catch {
        return `${amountMinor} ${currency} đơn vị nhỏ nhất`;
    }
}
