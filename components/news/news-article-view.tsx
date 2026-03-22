"use client";

import type { NewsArticle, NewsCategory } from "@/lib/interfaces/types";
import { ArrowLeft } from "lucide-react";
import { HoverableContent } from "@/components/hoverable-content";
import { useMarketStore } from "@/stores/market";
import { useNavigateToMarket } from "@/hooks/use-tab";
import { formatPrice, formatChange, changeColor } from "@/components/market/format";

const CATEGORY_COLORS: Record<NewsCategory, string> = {
  breaking: "bg-red-100 text-red-700",
  business: "bg-blue-100 text-blue-700",
  markets: "bg-emerald-100 text-emerald-700",
  world: "bg-amber-100 text-amber-700",
  politics: "bg-purple-100 text-purple-700",
  opinion: "bg-slate-100 text-slate-600",
};

export function NewsArticleView({
  article,
  onBack,
}: {
  article: NewsArticle;
  onBack: () => void;
}) {
  const companies = useMarketStore((s) => s.companies);
  const sectors = useMarketStore((s) => s.sectors);
  const navigateToMarket = useNavigateToMarket();

  // Find related companies and sectors from entities
  const relatedCompanies = companies.filter((c) =>
    article.entities?.some(
      (e) =>
        (e.type === "company" && e.text === c.name) ||
        (e.type === "ticker" && e.text === c.ticker),
    ),
  );
  const relatedSectors = sectors.filter((s) =>
    article.entities?.some(
      (e) => e.type === "sector" && e.text === s.name,
    ),
  );

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border px-4 py-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to news
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <h1 className="text-2xl font-bold text-foreground leading-tight mb-3">
          <HoverableContent content={article.headline} entities={article.entities} />
        </h1>
        <p className="text-base text-muted-foreground mb-4 italic">
          <HoverableContent content={article.summary} entities={article.entities} />
        </p>
        <div className="flex items-center gap-2 mb-6">
          <span
            className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${CATEGORY_COLORS[article.category]}`}
          >
            {article.category}
          </span>
          <span className="text-sm text-muted-foreground">
            {article.sourceDisplayName}
          </span>
          <span className="text-sm text-muted-foreground">
            · {new Date(article.timestamp).toLocaleString()}
          </span>
        </div>
        <div className="text-base text-foreground leading-relaxed whitespace-pre-wrap">
          <HoverableContent content={article.body} entities={article.entities} />
        </div>

        {/* Related market data */}
        {(relatedCompanies.length > 0 || relatedSectors.length > 0) && (
          <div className="mt-6 pt-4 border-t border-border">
            <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              Related Market Data
            </h3>
            {relatedCompanies.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-2">
                {relatedCompanies.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => navigateToMarket({ ticker: c.ticker })}
                    className="flex items-center gap-2 text-sm border border-border rounded px-3 py-1.5 hover:bg-accent/30 transition-colors cursor-pointer"
                  >
                    <span className="font-mono font-semibold">{c.ticker}</span>
                    <span className="font-mono">${formatPrice(c.currentPrice)}</span>
                    <span className={`font-mono text-xs ${changeColor(c.change)}`}>
                      {formatChange(c.change, c.changePercent)}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {relatedSectors.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {relatedSectors.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => navigateToMarket({ sector: s.id })}
                    className="flex items-center gap-2 text-sm border border-border rounded px-3 py-1.5 hover:bg-accent/30 transition-colors cursor-pointer"
                  >
                    <span className="font-medium">{s.name}</span>
                    <span className={`font-mono ${changeColor(s.indexValue - 100)}`}>
                      {formatPrice(s.indexValue)}
                    </span>
                    <span className="text-[10px] px-1 py-0.5 rounded bg-slate-100 text-slate-600">
                      {s.status}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
