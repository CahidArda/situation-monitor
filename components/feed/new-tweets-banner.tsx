"use client";

import { useFeedStore } from "@/stores/feed";
import { fetchTweets } from "@/hooks/use-tweets";
import { useCallback } from "react";

export function NewTweetsBanner() {
  const count = useFeedStore((s) => s.newTweetCount);
  const latestTimestamp = useFeedStore((s) => s.latestTimestamp);
  const prependTweets = useFeedStore((s) => s.prependTweets);
  const setNewTweetCount = useFeedStore((s) => s.setNewTweetCount);

  const handleClick = useCallback(async () => {
    if (latestTimestamp <= 0) return;
    const { tweets } = await fetchTweets({ afterTs: latestTimestamp });
    prependTweets(tweets);
    setNewTweetCount(0);
  }, [latestTimestamp, prependTweets, setNewTweetCount]);

  if (count <= 0) return null;

  return (
    <button
      onClick={handleClick}
      className="w-full border-b border-border bg-accent/50 px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent transition-colors"
    >
      Show {count} new tweet{count !== 1 ? "s" : ""}
    </button>
  );
}
