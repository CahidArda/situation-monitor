"use client";

import type { NewsArticle } from "@/lib/interfaces/types";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

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
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="outline">{article.category}</Badge>
          <span className="text-sm text-muted-foreground">
            {article.sourceDisplayName}
          </span>
          <span className="text-sm text-muted-foreground">
            · {new Date(article.timestamp).toLocaleString()}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-foreground leading-tight mb-3">
          {article.headline}
        </h1>
        <p className="text-base text-muted-foreground mb-6 italic">
          {article.summary}
        </p>
        <div className="prose prose-invert prose-sm max-w-none text-foreground whitespace-pre-wrap">
          {article.body}
        </div>
      </div>
    </div>
  );
}
