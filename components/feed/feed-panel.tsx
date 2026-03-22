"use client";

import { useEffect, useRef, useCallback } from "react";
import { X } from "lucide-react";
import { useTweets, useNewTweetCount, fetchTweets } from "@/hooks/use-tweets";
import { useFeedStore } from "@/stores/feed";
import { playNotificationSound } from "@/lib/sounds";
import { TweetList } from "./tweet-list";

export function FeedPanel() {
  const setTweets = useFeedStore((s) => s.setTweets);
  const prependTweets = useFeedStore((s) => s.prependTweets);
  const latestTimestamp = useFeedStore((s) => s.latestTimestamp);
  const filter = useFeedStore((s) => s.filter);
  const setFilter = useFeedStore((s) => s.setFilter);
  const clearHighlights = useFeedStore((s) => s.clearHighlights);

  const { data, isLoading } = useTweets(filter);

  useEffect(() => {
    if (data?.tweets) {
      setTweets(data.tweets);
    }
  }, [data, setTweets]);

  // Poll for new tweets and auto-prepend them
  const { data: countData } = useNewTweetCount(
    filter ? 0 : latestTimestamp,
  );

  const prevCount = useRef(0);
  useEffect(() => {
    if (countData != null && countData > prevCount.current && latestTimestamp > 0) {
      playNotificationSound();
      // Auto-fetch and prepend new tweets
      fetchTweets({ afterTs: latestTimestamp }).then(({ tweets: newTweets }) => {
        if (newTweets.length > 0) prependTweets(newTweets);
      });
    }
    if (countData != null) prevCount.current = countData;
  }, [countData, latestTimestamp, prependTweets]);

  // Clear highlights on any user interaction
  const handleInteraction = useCallback(() => {
    clearHighlights();
  }, [clearHighlights]);

  return (
    <div
      className="flex flex-col flex-1 min-h-0"
      onClick={handleInteraction}
      onScroll={handleInteraction}
    >
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
      <TweetList isLoading={isLoading} />
    </div>
  );
}
