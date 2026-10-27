export function formatMoney(amountMinor: number, currency: string) {
    if (!Number.isSafeInteger(amountMinor) || amountMinor < 0)
        return "Price unavailable";
    try {
        if (!Intl.supportedValuesOf("currency").includes(currency))
            return `${amountMinor} ${currency} minor units`;
        const format = new Intl.NumberFormat("en", { style: "currency", currency });
        const digits = format.resolvedOptions().maximumFractionDigits ?? 2;
        return format.format(amountMinor / 10 ** digits);
    }
    catch {
        return `${amountMinor} ${currency} minor units`;
    }
}
