"use client";

import type { NewsArticle, NewsCategory } from "@/lib/interfaces/types";
import { HoverableContent } from "@/components/hoverable-content";

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const CATEGORY_COLORS: Record<NewsCategory, string> = {
  breaking: "bg-red-100 text-red-700",
  business: "bg-blue-100 text-blue-700",
  markets: "bg-emerald-100 text-emerald-700",
  world: "bg-amber-100 text-amber-700",
  politics: "bg-purple-100 text-purple-700",
  opinion: "bg-slate-100 text-slate-600",
};

export function NewsCard({
  article,
  onClick,
}: {
  article: NewsArticle;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left border-b border-border px-4 py-4 hover:bg-accent/30 transition-colors"
    >
      <h3 className="font-semibold text-foreground leading-snug">
        <HoverableContent content={article.headline} entities={article.entities} />
      </h3>
      <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">
        <HoverableContent content={article.summary} entities={article.entities} />
      </p>
      <div className="flex items-center gap-2 mt-2">
        <span
          className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${CATEGORY_COLORS[article.category]}`}
        >
          {article.category}
        </span>
        <span className="text-xs text-muted-foreground">
          {article.sourceDisplayName}
        </span>
        <span className="text-xs text-muted-foreground">
          · {timeAgo(article.timestamp)}
        </span>
      </div>
    </button>
  );
}
