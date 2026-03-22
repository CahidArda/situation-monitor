"use client";

import type { NewsArticle, NewsCategory } from "@/lib/interfaces/types";
import { ArrowLeft } from "lucide-react";
import { HoverableContent } from "@/components/hoverable-content";

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
      </div>
    </div>
  );
}
