import { s } from "@upstash/redis";
import { redis } from "./redis";

// ---------------------------------------------------------------------------
// Tweet index
// ---------------------------------------------------------------------------
const tweetSchema = s.object({
  authorId: s.keyword(),
  authorHandle: s.keyword(),
  content: s.string(),
  timestamp: s.number("F64"),
  eventChainId: s.keyword(),
});

export type TweetSearchSchema = typeof tweetSchema;

export async function createTweetIndex() {
  return redis.search.createIndex({
    name: "idx:tweets",
    prefix: "tweet:",
    dataType: "json",
    existsOk: true,
    schema: tweetSchema,
  });
}

export function getTweetIndex() {
  return redis.search.index({
    name: "idx:tweets",
    schema: tweetSchema,
  });
}

// ---------------------------------------------------------------------------
// News index
// ---------------------------------------------------------------------------
const newsSchema = s.object({
  headline: s.string(),
  summary: s.string(),
  category: s.keyword(),
  timestamp: s.number("F64"),
  source: s.keyword(),
  eventChainId: s.keyword(),
});

export type NewsSearchSchema = typeof newsSchema;

export async function createNewsIndex() {
  return redis.search.createIndex({
    name: "idx:news",
    prefix: "news:",
    dataType: "json",
    existsOk: true,
    schema: newsSchema,
  });
}

export function getNewsIndex() {
  return redis.search.index({
    name: "idx:news",
    schema: newsSchema,
  });
}

// ---------------------------------------------------------------------------
// DM index
// ---------------------------------------------------------------------------
const dmSchema = s.object({
  fromPersonaId: s.keyword(),
  fromHandle: s.keyword(),
  timestamp: s.number("F64"),
  type: s.keyword(),
  content: s.string(),
});

export type DMSearchSchema = typeof dmSchema;

export async function createDMIndex() {
  return redis.search.createIndex({
    name: "idx:dms",
    prefix: "dm:",
    dataType: "json",
    existsOk: true,
    schema: dmSchema,
  });
}

export function getDMIndex() {
  return redis.search.index({
    name: "idx:dms",
    schema: dmSchema,
  });
}

// ---------------------------------------------------------------------------
// Bootstrap all indexes (call once at startup / deploy)
// ---------------------------------------------------------------------------
export async function ensureSearchIndexes() {
  await Promise.all([createTweetIndex(), createNewsIndex(), createDMIndex()]);
}
