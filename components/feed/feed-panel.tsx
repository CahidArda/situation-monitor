"use client";

import { useEffect } from "react";
import { useTweets, useNewTweetCount } from "@/hooks/use-tweets";
import { useFeedStore } from "@/stores/feed";
import { NewTweetsBanner } from "./new-tweets-banner";
import { TweetList } from "./tweet-list";

export function FeedPanel() {
  const setTweets = useFeedStore((s) => s.setTweets);
  const setNewTweetCount = useFeedStore((s) => s.setNewTweetCount);
  const latestTimestamp = useFeedStore((s) => s.latestTimestamp);

  // Initial fetch
  const { data } = useTweets();

  useEffect(() => {
    if (data?.tweets) {
      setTweets(data.tweets);
    }
  }, [data, setTweets]);

  // Poll for new count
  const { data: countData } = useNewTweetCount(latestTimestamp);

  useEffect(() => {
    if (countData != null) {
      setNewTweetCount(countData);
    }
  }, [countData, setNewTweetCount]);

  return (
    <aside className="flex flex-col h-full border-l border-border bg-background">
      <div className="border-b border-border px-4 py-3">
        <h2 className="font-mono text-sm font-semibold tracking-wide text-muted-foreground">
          FEED
        </h2>
      </div>
      <NewTweetsBanner />
      <TweetList />
    </aside>
  );
}
