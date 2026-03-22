"use client";

import { usePriceHistory } from "@/hooks/use-market";
import { Sparkline } from "./sparkline";
import { formatPrice, formatChange, changeColor } from "./format";

export function GlobalIndexBar({
  value,
  change,
  changePercent,
}: {
  value: number;
  change: number;
  changePercent: number;
}) {
  const { data: history } = usePriceHistory("global", "global");
  const prices = history?.map((h) => h.price) ?? [];

  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-border">
      <div>
        <div className="text-xs text-muted-foreground font-medium">GLOBAL INDEX</div>
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-mono font-semibold">{formatPrice(value)}</span>
          <span className={`text-sm font-mono ${changeColor(change)}`}>
            {formatChange(change, changePercent)}
          </span>
        </div>
      </div>
      {prices.length > 1 && <Sparkline data={prices} width={120} height={28} />}
    </div>
  );
}
