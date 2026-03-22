"use client";

import { useEffect } from "react";
import { Loader2, X } from "lucide-react";
import { useNews } from "@/hooks/use-news";
import { useNewsStore } from "@/stores/news";
import { NewsCard } from "./news-card";
import { NewsArticleView } from "./news-article-view";

export function NewsTab() {
  const filter = useNewsStore((s) => s.filter);
  const setFilter = useNewsStore((s) => s.setFilter);
  const { data, isLoading } = useNews(filter);
  const articles = useNewsStore((s) => s.articles);
  const setArticles = useNewsStore((s) => s.setArticles);
  const selectedArticle = useNewsStore((s) => s.selectedArticle);
  const selectArticle = useNewsStore((s) => s.selectArticle);

  useEffect(() => {
    if (data?.articles) {
      setArticles(data.articles);
    }
  }, [data, setArticles]);

  if (selectedArticle) {
    return (
      <NewsArticleView
        article={selectedArticle}
        onBack={() => selectArticle(null)}
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
              onClick={() => selectArticle(article)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
