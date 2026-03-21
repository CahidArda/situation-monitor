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

  const { data, isLoading } = useTweets();

  useEffect(() => {
    if (data?.tweets) {
      setTweets(data.tweets);
    }
  }, [data, setTweets]);

  const { data: countData } = useNewTweetCount(latestTimestamp);

  useEffect(() => {
    if (countData != null) {
      setNewTweetCount(countData);
    }
  }, [countData, setNewTweetCount]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <NewTweetsBanner />
      <TweetList isLoading={isLoading} />
    </div>
  );
}
