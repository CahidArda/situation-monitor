import { create } from "zustand";
import type { NewsArticle } from "@/lib/interfaces/types";

export type NewsFilter = {
  search?: string;
  label?: string;
};

type NewsStore = {
  articles: NewsArticle[];
  selectedArticle: NewsArticle | null;
  hasMore: boolean;
  filter: NewsFilter | null;

  setArticles: (articles: NewsArticle[]) => void;
  prependArticles: (articles: NewsArticle[]) => void;
  selectArticle: (article: NewsArticle | null) => void;
  setFilter: (filter: NewsFilter | null) => void;
};

export const useNewsStore = create<NewsStore>()((set) => ({
  articles: [],
  selectedArticle: null,
  hasMore: true,
  filter: null,

  setArticles: (articles) =>
    set({ articles, hasMore: articles.length >= 10 }),

  prependArticles: (newArticles) =>
    set((state) => {
      const existing = new Set(state.articles.map((a) => a.id));
      const unique = newArticles.filter((a) => !existing.has(a.id));
      return { articles: [...unique, ...state.articles] };
    }),

  selectArticle: (article) => set({ selectedArticle: article }),

  setFilter: (filter) => set({ filter, articles: [], selectedArticle: null }),
}));
