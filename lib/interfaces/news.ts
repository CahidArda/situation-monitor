import type { NewsArticle } from "./types";

export interface NewsInterface {
  /** Write a news article (called by event handlers). */
  write(article: Omit<NewsArticle, "id" | "timestamp">): Promise<NewsArticle>;

  /** List articles, paginated, newest first. Optionally filter by category. */
  list(params: {
    afterTs?: number;
    beforeTs?: number;
    limit?: number;
    category?: string;
  }): Promise<{ articles: NewsArticle[]; hasMore: boolean }>;

  /** Get a single article by ID. */
  get(id: string): Promise<NewsArticle | null>;
}
