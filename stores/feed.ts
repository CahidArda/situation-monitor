import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Tweet } from "@/lib/interfaces/types";

export type FeedFilter = {
  search?: string;
  authorId?: string;
  label?: string; // human-readable description of the active filter
};

interface FeedStore {
  tweets: Tweet[];
  latestTimestamp: number;
  newTweetCount: number;
  isLoadingMore: boolean;
  hasMore: boolean;
  likedTweetIds: string[];
  filter: FeedFilter | null;
  highlightedIds: string[];

  setTweets: (tweets: Tweet[]) => void;
  prependTweets: (tweets: Tweet[]) => void;
  appendTweets: (tweets: Tweet[], hasMore: boolean) => void;
  setNewTweetCount: (count: number) => void;
  setIsLoadingMore: (v: boolean) => void;
  toggleLike: (tweetId: string) => void;
  isLiked: (tweetId: string) => boolean;
  setFilter: (filter: FeedFilter | null) => void;
  clearHighlights: () => void;
}

export const useFeedStore = create<FeedStore>()(
  persist(
    (set, get) => ({
      tweets: [],
      latestTimestamp: 0,
      newTweetCount: 0,
      isLoadingMore: false,
      hasMore: true,
      likedTweetIds: [],
      filter: null,
      highlightedIds: [],

      setTweets: (tweets) =>
        set({
          tweets,
          latestTimestamp:
            tweets.length > 0
              ? Math.max(...tweets.map((t) => t.timestamp))
              : 0,
          hasMore: tweets.length >= 20,
        }),

      prependTweets: (newTweets) =>
        set((state) => {
          const existing = new Set(state.tweets.map((t) => t.id));
          const unique = newTweets.filter((t) => !existing.has(t.id));
          const merged = [...unique, ...state.tweets];
          return {
            tweets: merged,
            highlightedIds: [...state.highlightedIds, ...unique.map((t) => t.id)],
            latestTimestamp:
              merged.length > 0
                ? Math.max(...merged.map((t) => t.timestamp))
                : state.latestTimestamp,
            newTweetCount: 0,
          };
        }),

      appendTweets: (older, hasMore) =>
        set((state) => {
          const existing = new Set(state.tweets.map((t) => t.id));
          const unique = older.filter((t) => !existing.has(t.id));
          return {
            tweets: [...state.tweets, ...unique],
            hasMore,
            isLoadingMore: false,
          };
        }),

      setNewTweetCount: (count) => set({ newTweetCount: count }),

      setIsLoadingMore: (v) => set({ isLoadingMore: v }),

      toggleLike: (tweetId) =>
        set((state) => {
          const liked = new Set(state.likedTweetIds);
          if (liked.has(tweetId)) {
            liked.delete(tweetId);
          } else {
            liked.add(tweetId);
          }
          return { likedTweetIds: [...liked] };
        }),

      isLiked: (tweetId) => get().likedTweetIds.includes(tweetId),

      setFilter: (filter) => set({ filter, tweets: [], latestTimestamp: 0, newTweetCount: 0, highlightedIds: [] }),

      clearHighlights: () => set({ highlightedIds: [] }),
    }),
    {
      name: "mts:feed",
      partialize: (state) => ({ likedTweetIds: state.likedTweetIds }),
    },
  ),
);
