"use client";

import { useMarketStore } from "@/stores/market";
import { useNewsStore } from "@/stores/news";
import { useNavigateToNews, useNavigateToMarket } from "@/hooks/use-tab";
import { formatPrice, changeColor } from "@/components/market/format";

function TickerItem({
  ticker,
  price,
  change,
  onClick,
}: {
  ticker: string;
  price: number;
  change: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 mx-3 text-xs font-mono whitespace-nowrap hover:underline cursor-pointer"
    >
      <span className="font-semibold">{ticker}</span>
      <span>${formatPrice(price)}</span>
      <span className={changeColor(change)}>
        {change >= 0 ? "▲" : "▼"} {Math.abs(change).toFixed(2)}%
      </span>
    </button>
  );
}

function NewsItem({
  headline,
  onClick,
}: {
  headline: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center mx-3 text-xs whitespace-nowrap hover:underline cursor-pointer"
    >
      <span className="text-amber-600 font-semibold mr-1">BREAKING</span>
      <span className="text-muted-foreground">{headline}</span>
    </button>
  );
}

export function TickerTape() {
  const companies = useMarketStore((s) => s.companies);
  const commodities = useMarketStore((s) => s.commodities);
  const articles = useNewsStore((s) => s.articles);
  const navigateToNews = useNavigateToNews();
  const navigateToMarket = useNavigateToMarket();

  const tickers = [
    ...companies.map((c) => ({
      key: c.id,
      ticker: c.ticker,
      price: c.currentPrice,
      change: c.changePercent,
    })),
    ...commodities.map((c) => ({
      key: c.id,
      ticker: c.ticker,
      price: c.currentPrice,
      change: c.changePercent,
    })),
  ];

  // Show only the latest news headline (avoid spamming BREAKING items)
  const latestNews = articles.slice(0, 1);

  if (tickers.length === 0 && latestNews.length === 0) return null;

  const content = (
    <>
      {tickers.map((t) => (
        <TickerItem
          key={t.key}
          ticker={t.ticker}
          price={t.price}
          change={t.change}
          onClick={() => navigateToMarket({ ticker: t.ticker })}
        />
      ))}
      {latestNews.map((n) => (
        <NewsItem
          key={n.id}
          headline={n.headline}
          onClick={() => navigateToNews(n.id)}
        />
      ))}
    </>
  );

  return (
    <div className="border-b border-border overflow-hidden h-6 flex items-center bg-accent/20">
      <div className="animate-ticker flex">
        {content}
        {content}
      </div>
    </div>
  );
}
