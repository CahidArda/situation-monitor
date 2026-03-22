"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, X } from "lucide-react";
import { playNotificationSound } from "@/lib/sounds";
import { useNews } from "@/hooks/use-news";
import { useNewsStore } from "@/stores/news";
import { useNavigateToNews } from "@/hooks/use-tab";
import { NewsCard } from "./news-card";
import { NewsArticleView } from "./news-article-view";

export function NewsTab() {
  const searchParams = useSearchParams();
  const navigateToNews = useNavigateToNews();
  const filter = useNewsStore((s) => s.filter);
  const setFilter = useNewsStore((s) => s.setFilter);
  const { data, isLoading } = useNews(filter);
  const articles = useNewsStore((s) => s.articles);
  const setArticles = useNewsStore((s) => s.setArticles);
  const prependArticles = useNewsStore((s) => s.prependArticles);
  const selectedArticle = useNewsStore((s) => s.selectedArticle);
  const selectArticle = useNewsStore((s) => s.selectArticle);
  const clearHighlights = useNewsStore((s) => s.clearHighlights);

  // On initial load or filter change, set articles directly
  const initialized = useRef(false);
  useEffect(() => {
    if (data?.articles) {
      if (!initialized.current) {
        setArticles(data.articles);
        initialized.current = true;
      } else {
        // Find new articles not in current list
        const currentIds = new Set(articles.map((a) => a.id));
        const newOnes = data.articles.filter((a) => !currentIds.has(a.id));
        if (newOnes.length > 0) {
          playNotificationSound();
          prependArticles(newOnes);
        }
      }
    }
  }, [data, setArticles, prependArticles, articles]);

  // Reset initialized on filter change
  useEffect(() => {
    initialized.current = false;
  }, [filter]);

  // Sync selected article from URL param
  const newsId = searchParams.get("news");
  useEffect(() => {
    if (newsId && articles.length > 0) {
      const found = articles.find((a) => a.id === newsId);
      if (found && selectedArticle?.id !== found.id) {
        selectArticle(found);
      }
    } else if (!newsId && selectedArticle) {
      selectArticle(null);
    }
  }, [newsId, articles, selectedArticle, selectArticle]);

  const handleInteraction = useCallback(() => {
    clearHighlights();
  }, [clearHighlights]);

  if (selectedArticle) {
    return (
      <NewsArticleView
        article={selectedArticle}
        onBack={() => navigateToNews(null)}
      />
    );
  }

  return (
    <div
      className="flex flex-col flex-1 min-h-0"
      onClick={handleInteraction}
      onScroll={handleInteraction}
    >
      {filter && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-accent/30 text-sm">
          <span className="text-muted-foreground">Filtered:</span>
          <span className="font-medium text-foreground">{filter.label}</span>
          <button
            onClick={() => setFilter(null)}
            className="ml-auto text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {isLoading && articles.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : articles.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm p-8">
          {filter ? "No results found." : "No news yet. The situation remains unmonitored."}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {articles.map((article) => (
            <NewsCard
              key={article.id}
              article={article}
              onClick={() => navigateToNews(article.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
