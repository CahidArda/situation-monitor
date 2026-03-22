"use client";

import { useMemo } from "react";
import type { CompanyWithPrice } from "@/lib/interfaces/market";
import { useBatchPriceHistory } from "@/hooks/use-market";
import { Sparkline } from "./sparkline";
import { formatPrice, formatChange, changeColor } from "./format";
import { HoverableContent } from "@/components/hoverable-content";

const GRID = "grid grid-cols-[60px_1fr_80px_80px_100px_70px] items-center";

function CompanyRow({
  company,
  prices,
  onSelect,
}: {
  company: CompanyWithPrice;
  prices: number[];
  onSelect: (id: string) => void;
}) {
  const sectorNames = company.sectors.map((s) => s.sectorId).join(", ");

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(company.id)}
      onKeyDown={(e) => { if (e.key === "Enter") onSelect(company.id); }}
      className={`${GRID} px-4 py-2 border-b border-border hover:bg-accent/30 transition-colors cursor-pointer text-sm`}
    >
      <span className="font-mono font-semibold text-foreground">
        <HoverableContent
          content={company.ticker}
          entities={[{ text: company.ticker, type: "ticker" }]}
        />
      </span>
      <span className="truncate text-muted-foreground">
        <HoverableContent
          content={company.name}
          entities={[{ text: company.name, type: "company" }]}
        />
      </span>
      <span className="text-xs text-muted-foreground truncate">{sectorNames}</span>
      <span className="font-mono text-right">${formatPrice(company.currentPrice)}</span>
      <span className={`font-mono text-right text-xs ${changeColor(company.change)}`}>
        {formatChange(company.change, company.changePercent)}
      </span>
      <div className="flex justify-end">
        {prices.length > 1 && <Sparkline data={prices} width={50} height={18} />}
      </div>
    </div>
  );
}

export function CompanyTable({ companies, onSelect }: { companies: CompanyWithPrice[]; onSelect: (id: string) => void }) {
  const queries = useMemo(
    () => companies.map((c) => ({ type: "company", id: c.id })),
    [companies],
  );
  const { data: batchHistory } = useBatchPriceHistory(queries, 30);

  if (companies.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm p-8">
        No market data yet.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className={`${GRID} px-4 py-1.5 border-b border-border text-xs text-muted-foreground font-medium sticky top-0 bg-background`}>
        <span>Ticker</span>
        <span>Company</span>
        <span>Sector</span>
        <span className="text-right">Price</span>
        <span className="text-right">5-tick</span>
        <span className="text-right">Chart</span>
      </div>
      {companies.map((c) => {
        const history = batchHistory?.[`company:${c.id}`] ?? [];
        return (
          <CompanyRow
            key={c.id}
            company={c}
            prices={history.map((h) => h.price)}
            onSelect={onSelect}
          />
        );
      })}
    </div>
  );
}
