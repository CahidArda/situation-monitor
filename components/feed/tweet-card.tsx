"use client";

import type { Tweet } from "@/lib/interfaces/types";
import { useFeedStore } from "@/stores/feed";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function TweetCard({ tweet }: { tweet: Tweet }) {
  const toggleLike = useFeedStore((s) => s.toggleLike);
  const likedIds = useFeedStore((s) => s.likedTweetIds);
  const liked = likedIds.includes(tweet.id);

  return (
    <article className="border-b border-border px-4 py-3 hover:bg-card/50 transition-colors">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-base">
            <span className="font-semibold text-foreground truncate">
              {tweet.authorDisplayName}
            </span>
            <span className="text-muted-foreground truncate">
              {tweet.authorHandle}
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground text-sm whitespace-nowrap">
              {timeAgo(tweet.timestamp)}
            </span>
          </div>

          <p className="mt-1 text-base text-foreground whitespace-pre-wrap wrap-break-word">
            {tweet.content}
          </p>

          {tweet.newsLink && (
            <div className="mt-2 rounded border border-border bg-card p-2 text-sm text-muted-foreground">
              📰 {tweet.newsLink.headline}
            </div>
          )}

          <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
            <button
              onClick={() => toggleLike(tweet.id)}
              className={cn(
                "flex items-center gap-1 transition-colors hover:text-red-400",
                liked && "text-red-500",
              )}
            >
              <Heart
                className={cn("h-3.5 w-3.5", liked && "fill-current")}
              />
              <span>{liked ? tweet.likes + 1 : tweet.likes}</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
