"use client";

import { ArrowLeft } from "lucide-react";
import type { CompanyWithPrice } from "@/lib/interfaces/market";
import { usePriceHistory } from "@/hooks/use-market";
import { Sparkline } from "./sparkline";
import { formatPrice, formatChange, changeColor } from "./format";
import { HoverableContent } from "@/components/hoverable-content";

export function CompanyDetail({
  company,
  onBack,
}: {
  company: CompanyWithPrice;
  onBack: () => void;
}) {
  const { data: history } = usePriceHistory("company", company.id, 100);
  const prices = history?.map((h) => h.price) ?? [];

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border px-4 py-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to market
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-bold">
                <HoverableContent
                  content={company.ticker}
                  entities={[{ text: company.ticker, type: "ticker" }]}
                />
              </span>
              <span className="text-2xl font-mono font-semibold">
                ${formatPrice(company.currentPrice)}
              </span>
              <span className={`font-mono ${changeColor(company.change)}`}>
                {formatChange(company.change, company.changePercent)}
              </span>
              <span className="text-xs text-muted-foreground">5-tick (~5m)</span>
            </div>
            <h2 className="text-lg text-foreground mt-1">
              <HoverableContent
                content={company.name}
                entities={[{ text: company.name, type: "company" }]}
              />
            </h2>
            <p className="text-sm text-muted-foreground mt-1">{company.description}</p>
          </div>
        </div>

        {prices.length > 1 && (
          <div className="mb-6 border border-border rounded p-4">
            <div className="text-xs text-muted-foreground mb-2">
              Price history (last {prices.length} ticks, ~1 tick/min)
            </div>
            <Sparkline data={prices} width={500} height={120} showLabels />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">CEO</span>
            <p className="font-medium">
              <HoverableContent
                content={company.ceoName}
                entities={[{ text: company.ceoName, type: "person" }]}
              />
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">HQ</span>
            <p className="font-medium">{company.headquarters.city}, {company.headquarters.country}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Founded</span>
            <p className="font-medium">{company.founded}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Employees</span>
            <p className="font-medium">{company.employees.toLocaleString()}</p>
          </div>
          <div className="col-span-2">
            <span className="text-muted-foreground">Sectors</span>
            <p className="font-medium">
              {company.sectors.map((s) => s.sectorId).join(", ")}
            </p>
          </div>
          <div className="col-span-2">
            <span className="text-muted-foreground">Fun fact</span>
            <p className="italic text-muted-foreground">{company.funFact}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
