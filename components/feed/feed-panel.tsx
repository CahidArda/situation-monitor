"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useTweets, useNewTweetCount } from "@/hooks/use-tweets";
import { useFeedStore } from "@/stores/feed";
import { playNotificationSound } from "@/lib/sounds";
import { NewTweetsBanner } from "./new-tweets-banner";
import { TweetList } from "./tweet-list";

export function FeedPanel() {
  const setTweets = useFeedStore((s) => s.setTweets);
  const setNewTweetCount = useFeedStore((s) => s.setNewTweetCount);
  const latestTimestamp = useFeedStore((s) => s.latestTimestamp);
  const filter = useFeedStore((s) => s.filter);
  const setFilter = useFeedStore((s) => s.setFilter);

  const { data, isLoading } = useTweets(filter);

  useEffect(() => {
    if (data?.tweets) {
      setTweets(data.tweets);
    }
  }, [data, setTweets]);

  const { data: countData } = useNewTweetCount(
    filter ? 0 : latestTimestamp, // disable polling when filtered
  );

  const prevCount = useRef(0);
  useEffect(() => {
    if (countData != null) {
      if (countData > prevCount.current) playNotificationSound();
      prevCount.current = countData;
      setNewTweetCount(countData);
    }
  }, [countData, setNewTweetCount]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
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
      {!filter && <NewTweetsBanner />}
      <TweetList isLoading={isLoading} />
    </div>
  );
}
