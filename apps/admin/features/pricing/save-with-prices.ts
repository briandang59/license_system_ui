import { priceService } from "./service";
import type { PriceEntry } from "./entry-schema";

export async function saveWithPrices({ kind, saveParent, onParentSaved, prices, onRemaining }: {
  kind: "plans" | "features";
  saveParent: () => Promise<{ id: number }>;
  onParentSaved: (id: number) => void;
  prices: PriceEntry[];
  onRemaining: (prices: PriceEntry[]) => void;
}) {
  const parent = await saveParent();
  onParentSaved(parent.id);
  for (const [index, price] of prices.entries()) {
    await priceService.create(kind, parent.id, {
      ...price,
      effective_from: price.effective_from.toISOString(),
      effective_to: price.effective_to?.toISOString() ?? null,
    });
    onRemaining(prices.slice(index + 1));
  }
}
