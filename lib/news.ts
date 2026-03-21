import { nanoid } from "nanoid";
import { redis } from "./redis";
import { getNewsIndex } from "./search";
import type { NewsArticle } from "./interfaces/types";
import type { NewsInterface } from "./interfaces/news";

const index = getNewsIndex();

export const news: NewsInterface = {
  async write(input) {
    const article: NewsArticle = {
      ...input,
      id: nanoid(),
      timestamp: Date.now(),
    };

    await redis.json.set(`news:${article.id}`, "$", article);
    return article;
  },

  async list({ afterTs, beforeTs, limit = 10, category }) {
    const filters: Record<string, unknown>[] = [];

    if (afterTs != null) {
      filters.push({ timestamp: { $gt: afterTs } });
    }
    if (beforeTs != null) {
      filters.push({ timestamp: { $lt: beforeTs } });
    }
    if (category) {
      filters.push({ category: { $eq: category } });
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
      limit: limit + 1,
    });

    const hasMore = results.length > limit;
    const page = hasMore ? results.slice(0, limit) : results;

    const articles: NewsArticle[] = page
      .map((r) => r.data as NewsArticle | undefined)
      .filter((a): a is NewsArticle => a != null);

    return { articles, hasMore };
  },

  async get(id) {
    const data = await redis.json.get(`news:${id}`);
    return (data as NewsArticle) ?? null;
  },
};
