import type { Tweet } from "./types";

export interface TweetInterface {
  /** Write a tweet (called by event handlers). */
  write(tweet: Omit<Tweet, "id" | "timestamp" | "likes">): Promise<Tweet>;

  /** List tweets, paginated, newest first. Supports text search and author filter. */
  list(params: {
    afterTs?: number;
    beforeTs?: number;
    limit?: number;
    search?: string;
    authorId?: string;
  }): Promise<{ tweets: Tweet[]; hasMore: boolean }>;

  /** Count tweets newer than a given timestamp. */
  getNewCount(afterTs: number): Promise<number>;
}
