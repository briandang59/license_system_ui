export function formatNumber(value: number | bigint): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 20 }).format(value);
}

export const parseNumber = (value: string | undefined): number => value?.trim() ? Number(value.replaceAll(",", "")) : NaN;

export function formatNumberInput(value: number | string | undefined, info: { userTyping: boolean; input: string }): string {
  if (!info.userTyping) return value == null || value === "" ? "" : formatNumber(Number(value));
  const [integer, ...fraction] = info.input.replaceAll(",", "").split(".");
  return integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (fraction.length ? `.${fraction.join(".")}` : "");
}
