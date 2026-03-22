"use client";

import type { CommodityWithPrice } from "@/lib/interfaces/market";
import { formatPrice, changeColor } from "./format";
import { HoverableContent } from "@/components/hoverable-content";

export function CommodityRow({ commodities }: { commodities: CommodityWithPrice[] }) {
  if (commodities.length === 0) return null;

  return (
    <div className="flex gap-4 px-4 py-2 border-b border-border overflow-x-auto">
      {commodities.map((c) => (
        <div key={c.id} className="shrink-0 text-sm">
          <span className="font-mono font-medium text-foreground">
            <HoverableContent
              content={c.ticker}
              entities={[{ text: c.ticker, type: "ticker" }, { text: c.name, type: "commodity" }]}
            />
          </span>
          <span className="ml-2 font-mono">${formatPrice(c.currentPrice)}</span>
          <span className={`ml-1 font-mono text-xs ${changeColor(c.change)}`}>
            {c.change >= 0 ? "+" : ""}{c.changePercent.toFixed(2)}%
          </span>
        </div>
      ))}
    </div>
  );
}
