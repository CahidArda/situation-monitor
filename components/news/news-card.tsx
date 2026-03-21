"use client";

import type { NewsArticle } from "@/lib/interfaces/types";
import { Badge } from "@/components/ui/badge";

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

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
      className="w-full text-left border-b border-border px-4 py-4 hover:bg-card/50 transition-colors"
    >
      <div className="flex items-center gap-2 mb-1.5">
        <Badge variant="outline" className="text-xs">
          {article.category}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {article.sourceDisplayName}
        </span>
        <span className="text-xs text-muted-foreground">
          · {timeAgo(article.timestamp)}
        </span>
      </div>
      <h3 className="font-semibold text-foreground leading-snug">
        {article.headline}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
        {article.summary}
      </p>
    </button>
  );
}
