"use client";

import { useEffect, useRef } from "react";
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
  const selectedArticle = useNewsStore((s) => s.selectedArticle);
  const selectArticle = useNewsStore((s) => s.selectArticle);

  const prevArticleCount = useRef(0);
  useEffect(() => {
    if (data?.articles) {
      if (data.articles.length > prevArticleCount.current && prevArticleCount.current > 0) {
        playNotificationSound();
      }
      prevArticleCount.current = data.articles.length;
      setArticles(data.articles);
    }
  }, [data, setArticles]);

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

  if (selectedArticle) {
    return (
      <NewsArticleView
        article={selectedArticle}
        onBack={() => navigateToNews(null)}
      />
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {filter && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-accent/30 text-sm">
          <span className="text-muted-foreground">Filtered:</span>
          <span className="font-medium text-foreground">{filter.label}</span>
          <button
            onClick={() => setFilter(null)}
            className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
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
