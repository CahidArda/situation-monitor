"use client";

import type { Tweet } from "@/lib/interfaces/types";
import { useFeedStore } from "@/stores/feed";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { HoverableContent } from "@/components/hoverable-content";
import { UserPopover } from "@/components/user-popover";
import { useNavigateToNews } from "@/hooks/use-tab";

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
  const navigateToNews = useNavigateToNews();
  const toggleLike = useFeedStore((s) => s.toggleLike);
  const likedIds = useFeedStore((s) => s.likedTweetIds);
  const highlightedIds = useFeedStore((s) => s.highlightedIds);
  const liked = likedIds.includes(tweet.id);
  const isHighlighted = highlightedIds.includes(tweet.id);

  return (
    <article
      className={cn(
        "border-b border-border px-4 py-3 hover:bg-accent/30 transition-colors duration-700",
        isHighlighted && "bg-blue-50",
      )}
    >
      <p className="text-base text-foreground whitespace-pre-wrap wrap-break-word leading-relaxed">
        <HoverableContent content={tweet.content} entities={tweet.entities} />
      </p>

      {tweet.newsLink && (
        <button
          onClick={() => navigateToNews(tweet.newsLink!.newsId)}
          className="mt-2 w-full text-left rounded border border-border bg-accent/50 p-2 text-sm text-muted-foreground hover:bg-accent transition-colors cursor-pointer"
        >
          📰 {tweet.newsLink.headline}
        </button>
      )}

      <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
        <UserPopover personaId={tweet.authorId} displayName={tweet.authorDisplayName}>
          <span className="font-medium text-foreground">
            {tweet.authorDisplayName}
          </span>
          {" "}
          <span>{tweet.authorHandle}</span>
        </UserPopover>
        <span>·</span>
        <span>{timeAgo(tweet.timestamp)}</span>
        <span>·</span>
        <button
          onClick={() => toggleLike(tweet.id)}
          className={cn(
            "flex items-center gap-1 transition-colors hover:text-red-400",
            liked && "text-red-500",
          )}
        >
          <Heart
            className={cn("h-3 w-3", liked && "fill-current")}
          />
          <span>{liked ? tweet.likes + 1 : tweet.likes}</span>
        </button>
      </div>
    </article>
  );
}
