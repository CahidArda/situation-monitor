"use client";

import { usePriceHistory } from "@/hooks/use-market";
import { Sparkline } from "./sparkline";
import { formatPrice, formatChange, changeColor } from "./format";
import { HoverableContent } from "@/components/hoverable-content";
import type { CommodityWithPrice } from "@/lib/interfaces/market";

export function GlobalIndexBar({
  value,
  change,
  changePercent,
  commodities,
}: {
  value: number;
  change: number;
  changePercent: number;
  commodities: CommodityWithPrice[];
}) {
  const { data: history } = usePriceHistory("global", "global");
  const prices = history?.map((h) => h.price) ?? [];

  return (
    <div className="flex items-center gap-6 px-4 py-3 border-b border-border">
      <div className="shrink-0">
        <div className="text-xs text-muted-foreground font-medium">SITUATION INDEX</div>
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-mono font-semibold">{formatPrice(value)}</span>
          <span className={`text-sm font-mono ${changeColor(change)}`}>
            {formatChange(change, changePercent)}
          </span>
          <span className="text-[10px] text-muted-foreground">5-tick (~5m)</span>
        </div>
      </div>
      {prices.length > 1 && <Sparkline data={prices} width={100} height={24} />}

      {/* Commodities on the right */}
      <div className="ml-auto grid grid-cols-3 gap-x-5 gap-y-0.5 text-xs">
        {commodities.map((c) => (
          <div key={c.id} className="flex items-center gap-1.5 font-mono">
            <span className="font-semibold text-foreground">
              <HoverableContent
                content={c.ticker}
                entities={[{ text: c.ticker, type: "ticker" }, { text: c.name, type: "commodity" }]}
              />
            </span>
            <span>${formatPrice(c.currentPrice)}</span>
            <span className={changeColor(c.change)}>
              {c.change >= 0 ? "+" : ""}{c.changePercent.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
