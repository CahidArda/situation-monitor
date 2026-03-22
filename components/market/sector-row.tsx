"use client";

import { useMemo } from "react";
import type { SectorWithState } from "@/lib/interfaces/market";
import { useMarketStore } from "@/stores/market";
import { useBatchPriceHistory } from "@/hooks/use-market";
import { cn } from "@/lib/utils";
import { formatPrice } from "./format";

const STATUS_BADGE: Record<string, string> = {
  bull: "bg-emerald-100 text-emerald-700",
  bear: "bg-red-100 text-red-700",
  volatile: "bg-amber-100 text-amber-700",
  stable: "bg-slate-100 text-slate-600",
};

export function SectorRow({ sectors }: { sectors: SectorWithState[] }) {
  const selectedSectorIds = useMarketStore((s) => s.selectedSectorIds);
  const toggleSector = useMarketStore((s) => s.toggleSector);

  const queries = useMemo(
    () => sectors.map((s) => ({ type: "sector", id: s.id })),
    [sectors],
  );
  const { data: batchHistory } = useBatchPriceHistory(queries, 10);

  return (
    <div className="flex flex-wrap gap-2 px-4 py-2 border-b border-border">
      {sectors.map((sector) => {
        const isSelected = selectedSectorIds.includes(sector.id);
        const history = batchHistory?.[`sector:${sector.id}`] ?? [];
        const prices = history.map((h) => h.price);

        // Color based on 5-tick change
        let isUp = sector.indexValue >= 100;
        if (prices.length >= 2) {
          const lookback = Math.min(5, prices.length - 1);
          isUp = prices[prices.length - 1] >= prices[prices.length - 1 - lookback];
        }

        const valueColor = isUp ? "text-emerald-600" : "text-red-600";

        return (
          <button
            key={sector.id}
            onClick={() => toggleSector(sector.id)}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded text-xs transition-colors cursor-pointer",
              isSelected
                ? "bg-accent text-accent-foreground font-medium ring-1 ring-border"
                : "text-muted-foreground hover:bg-accent/50",
            )}
          >
            {sector.name}
            <span className={`ml-1 font-mono ${valueColor}`}>
              {formatPrice(sector.indexValue)}
            </span>
            <span className={`ml-1 text-[10px] px-1 py-0.5 rounded ${STATUS_BADGE[sector.status]}`}>
              {sector.status}
            </span>
          </button>
        );
      })}
    </div>
  );
}
