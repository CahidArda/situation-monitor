"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useNews } from "@/hooks/use-news";
import { useNewsStore } from "@/stores/news";
import { NewsCard } from "./news-card";
import { NewsArticleView } from "./news-article-view";

export function NewsTab() {
  const { data, isLoading } = useNews();
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

  if (isLoading && articles.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm p-8">
        No news yet. The situation remains unmonitored.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {articles.map((article) => (
        <NewsCard
          key={article.id}
          article={article}
          onClick={() => selectArticle(article)}
        />
      ))}
    </div>
  );
}
