"use client";

import type { CompanyWithPrice } from "@/lib/interfaces/market";
import { useMarketStore } from "@/stores/market";
import { usePriceHistory } from "@/hooks/use-market";
import { Sparkline } from "./sparkline";
import { formatPrice, formatChange, changeColor } from "./format";
import { HoverableContent } from "@/components/hoverable-content";

function CompanyRow({ company }: { company: CompanyWithPrice }) {
  const selectCompany = useMarketStore((s) => s.selectCompany);
  const { data: history } = usePriceHistory("company", company.id, 30);
  const prices = history?.map((h) => h.price) ?? [];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => selectCompany(company.id)}
      onKeyDown={(e) => { if (e.key === "Enter") selectCompany(company.id); }}
      className="grid grid-cols-[60px_1fr_80px_120px_80px] items-center px-4 py-2 border-b border-border hover:bg-accent/30 transition-colors cursor-pointer text-sm"
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
      <span className="font-mono text-right">${formatPrice(company.currentPrice)}</span>
      <span className={`font-mono text-right ${changeColor(company.change)}`}>
        {formatChange(company.change, company.changePercent)}
      </span>
      <div className="flex justify-end">
        {prices.length > 1 && <Sparkline data={prices} width={60} height={20} />}
      </div>
    </div>
  );
}

export function CompanyTable({ companies }: { companies: CompanyWithPrice[] }) {
  if (companies.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm p-8">
        No market data yet.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="grid grid-cols-[60px_1fr_80px_120px_80px] items-center px-4 py-1.5 border-b border-border text-xs text-muted-foreground font-medium sticky top-0 bg-background">
        <span>Ticker</span>
        <span>Company</span>
        <span className="text-right">Price</span>
        <span className="text-right">Change</span>
        <span className="text-right">Chart</span>
      </div>
      {companies.map((c) => (
        <CompanyRow key={c.id} company={c} />
      ))}
    </div>
  );
}
