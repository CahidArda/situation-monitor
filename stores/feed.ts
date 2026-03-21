import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Tweet } from "@/lib/interfaces/types";

interface FeedStore {
  tweets: Tweet[];
  latestTimestamp: number;
  newTweetCount: number;
  isLoadingMore: boolean;
  hasMore: boolean;
  likedTweetIds: string[];

  setTweets: (tweets: Tweet[]) => void;
  prependTweets: (tweets: Tweet[]) => void;
  appendTweets: (tweets: Tweet[], hasMore: boolean) => void;
  setNewTweetCount: (count: number) => void;
  setIsLoadingMore: (v: boolean) => void;
  toggleLike: (tweetId: string) => void;
  isLiked: (tweetId: string) => boolean;
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
    }),
    {
      name: "mts:feed",
      partialize: (state) => ({ likedTweetIds: state.likedTweetIds }),
    },
  ),
);
