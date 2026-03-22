"use client";

import type { SectorWithState } from "@/lib/interfaces/market";
import { useMarketStore } from "@/stores/market";
import { cn } from "@/lib/utils";
import { formatPrice, changeColor } from "./format";
import { HoverableContent } from "@/components/hoverable-content";

const STATUS_BADGE: Record<string, string> = {
  bull: "bg-emerald-100 text-emerald-700",
  bear: "bg-red-100 text-red-700",
  volatile: "bg-amber-100 text-amber-700",
  stable: "bg-slate-100 text-slate-600",
};

export function SectorRow({ sectors }: { sectors: SectorWithState[] }) {
  const selectedSectorId = useMarketStore((s) => s.selectedSectorId);
  const selectSector = useMarketStore((s) => s.selectSector);

  return (
    <div className="flex gap-2 px-4 py-3 border-b border-border overflow-x-auto">
      <button
        onClick={() => selectSector(null)}
        className={cn(
          "shrink-0 px-3 py-1.5 rounded text-xs font-medium transition-colors",
          !selectedSectorId ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50",
        )}
      >
        All
      </button>
      {sectors.map((sector) => {
        const diff = sector.indexValue - 100;
        return (
          <button
            key={sector.id}
            onClick={() => selectSector(sector.id === selectedSectorId ? null : sector.id)}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded text-xs transition-colors",
              sector.id === selectedSectorId
                ? "bg-accent text-accent-foreground font-medium"
                : "text-muted-foreground hover:bg-accent/50",
            )}
          >
            <HoverableContent
              content={sector.name}
              entities={[{ text: sector.name, type: "sector" }]}
            />
            <span className={`ml-1 font-mono ${changeColor(diff)}`}>
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
