"use client";

import { useQuery } from "@tanstack/react-query";
import type { NewsArticle } from "@/lib/interfaces/types";
import type { NewsFilter } from "@/stores/news";

async function fetchNews(params?: {
  afterTs?: number;
  beforeTs?: number;
  limit?: number;
  category?: string;
  search?: string;
}): Promise<{ articles: NewsArticle[]; hasMore: boolean }> {
  const sp = new URLSearchParams();
  if (params?.afterTs) sp.set("afterTs", String(params.afterTs));
  if (params?.beforeTs) sp.set("beforeTs", String(params.beforeTs));
  if (params?.limit) sp.set("limit", String(params.limit));
  if (params?.category) sp.set("category", params.category);
  if (params?.search) sp.set("search", params.search);
  const res = await fetch(`/api/news?${sp}`);
  return res.json();
}

export function useNews(filter?: NewsFilter | null) {
  return useQuery({
    queryKey: ["news", filter?.search ?? null],
    queryFn: () =>
      fetchNews({
        search: filter?.search,
      }),
    refetchInterval: 15_000,
  });
}

export { fetchNews };
