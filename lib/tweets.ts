import { nanoid } from "nanoid";
import { redis } from "./redis";
import { getTweetIndex } from "./search";
import type { Tweet } from "./interfaces/types";
import type { TweetInterface } from "./interfaces/tweets";

const index = getTweetIndex();

export const tweets: TweetInterface = {
  async write(input) {
    const tweet: Tweet = {
      ...input,
      id: nanoid(),
      timestamp: Date.now(),
      likes: Math.floor(Math.random() * 20), // simulated count
    };

    await redis.json.set(`tweet:${tweet.id}`, "$", tweet);
    return tweet;
  },

  async list({ afterTs, beforeTs, limit = 20 }) {
    const filters: Record<string, unknown>[] = [];

    if (afterTs != null) {
      filters.push({ timestamp: { $gt: afterTs } });
    }
    if (beforeTs != null) {
      filters.push({ timestamp: { $lt: beforeTs } });
    }

    const filter =
      filters.length > 1
        ? { $and: filters }
        : filters.length === 1
          ? filters[0]
          : undefined;

    const results = await index.query({
      filter,
      orderBy: { timestamp: "DESC" },
      limit: limit + 1, // fetch one extra to determine hasMore
    });

    const hasMore = results.length > limit;
    const page = hasMore ? results.slice(0, limit) : results;

    const tweetList: Tweet[] = page
      .map((r) => r.data as Tweet | undefined)
      .filter((t): t is Tweet => t != null);

    return { tweets: tweetList, hasMore };
  },

  async getNewCount(afterTs) {
    const { count } = await index.count({
      filter: { timestamp: { $gt: afterTs } },
    });
    return count;
  },
};
