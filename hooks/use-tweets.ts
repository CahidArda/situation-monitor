"use client";

import { useQuery } from "@tanstack/react-query";
import type { Tweet } from "@/lib/interfaces/types";
import type { FeedFilter } from "@/stores/feed";

async function fetchTweets(params?: {
  afterTs?: number;
  beforeTs?: number;
  limit?: number;
  search?: string;
  authorId?: string;
}): Promise<{ tweets: Tweet[]; hasMore: boolean }> {
  const sp = new URLSearchParams();
  if (params?.afterTs) sp.set("afterTs", String(params.afterTs));
  if (params?.beforeTs) sp.set("beforeTs", String(params.beforeTs));
  if (params?.limit) sp.set("limit", String(params.limit));
  if (params?.search) sp.set("search", params.search);
  if (params?.authorId) sp.set("authorId", params.authorId);
  const res = await fetch(`/api/tweets?${sp}`);
  return res.json();
}

async function fetchNewTweetCount(afterTs: number): Promise<number> {
  const res = await fetch(`/api/tweets/new-count?afterTs=${afterTs}`);
  const data = await res.json();
  return data.count;
}

export function useTweets(filter?: FeedFilter | null) {
  return useQuery({
    queryKey: ["tweets", filter?.search ?? null, filter?.authorId ?? null],
    queryFn: () =>
      fetchTweets({
        search: filter?.search,
        authorId: filter?.authorId,
      }),
  });
}

export function useNewTweetCount(afterTs: number) {
  return useQuery({
    queryKey: ["tweets", "new-count", afterTs],
    queryFn: () => fetchNewTweetCount(afterTs),
    refetchInterval: 10_000,
    enabled: afterTs > 0,
  });
}

export { fetchTweets };
