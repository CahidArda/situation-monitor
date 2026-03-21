import { create } from "zustand";
import type { NewsArticle } from "@/lib/interfaces/types";

type NewsStore = {
  articles: NewsArticle[];
  selectedArticle: NewsArticle | null;
  hasMore: boolean;

  setArticles: (articles: NewsArticle[]) => void;
  prependArticles: (articles: NewsArticle[]) => void;
  selectArticle: (article: NewsArticle | null) => void;
};

export const useNewsStore = create<NewsStore>()((set) => ({
  articles: [],
  selectedArticle: null,
  hasMore: true,

  setArticles: (articles) =>
    set({ articles, hasMore: articles.length >= 10 }),

  prependArticles: (newArticles) =>
    set((state) => {
      const existing = new Set(state.articles.map((a) => a.id));
      const unique = newArticles.filter((a) => !existing.has(a.id));
      return { articles: [...unique, ...state.articles] };
    }),

  selectArticle: (article) => set({ selectedArticle: article }),
}));
