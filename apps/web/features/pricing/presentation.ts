import type { CatalogItem, Offer } from "./schema";

export function catalogWithPricedFallback(catalog: CatalogItem[], offers: Offer[]): CatalogItem[] {
  const items = new Map(catalog.map(item => [`${item.kind}-${item.owner_id}`, item]));
  for (const offer of offers) {
    const key = `${offer.kind}-${offer.owner_id}`;
    if (!items.has(key)) items.set(key, {...offer, unit: null});
  }
  return [...items.values()];
}

export function matchingPrice(item: CatalogItem, offers: Offer[], currency: string, interval: string): Offer | undefined {
  return offers.find(offer => offer.kind === item.kind && offer.owner_id === item.owner_id && offer.product_id === item.product_id && offer.currency === currency && offer.billing_interval === interval);
}

export function benefitLimit(benefit: CatalogItem["benefits"][number]): string {
  if (benefit.feature_type === "unlimited") return "Không giới hạn";
  if (benefit.feature_type !== "quantity") return "Đã bao gồm";
  return benefit.limit_value === null ? "Hạn mức theo tư vấn" : `${benefit.limit_value.toLocaleString("en-US")}${benefit.unit ? ` ${benefit.unit}` : ""}`;
}

export function benefitKey(benefit: CatalogItem["benefits"][number]): string {
  return JSON.stringify([benefit.name, benefit.feature_type, benefit.unit]);
}
