"use client";

import { useFeedStore } from "@/stores/feed";
import { TweetCard } from "./tweet-card";

export function TweetList() {
  const tweets = useFeedStore((s) => s.tweets);

  if (tweets.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm p-8">
        No tweets yet. The situation has not yet developed.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {tweets.map((tweet) => (
        <TweetCard key={tweet.id} tweet={tweet} />
      ))}
    </div>
  );
}
