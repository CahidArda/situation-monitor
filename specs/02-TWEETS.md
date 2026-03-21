# 02 — Tweets Spec

## Overview

The tweet feed is the right panel of the app — a Twitter-like stream of posts from simulated accounts. Tweets come from personas (fake people/orgs), triggered by events. The feed auto-checks for new tweets every 10 seconds and shows a "N new tweets" button.

## Data Model

```typescript
interface Tweet {
  id: string;              // nanoid
  authorId: string;        // persona ID
  authorHandle: string;    // e.g. "@GoldBugLarry69"
  authorDisplayName: string;
  content: string;
  timestamp: number;       // unix ms
  likes: number;           // simulated count (not user-driven)
  newsLink?: {             // if tweet links to a news article
    newsId: string;
    headline: string;
  };
  eventChainId?: string;   // which event chain produced this tweet
  metadata?: Record<string, string>; // flexible extra data
}
```

## Redis Schema

Tweets are stored as JSON documents and indexed with Redis Search:

```typescript
import { s } from "@upstash/redis";

// Store each tweet as JSON
await redis.json.set(`tweet:${id}`, "$", tweet);

// Search index (created once at startup)
const tweetIndex = await redis.search.createIndex({
  name: "idx:tweets",
  prefix: "tweet:",
  dataType: "json",
  schema: s.object({
    authorId: s.keyword(),
    authorHandle: s.keyword(),
    content: s.string(),
    timestamp: s.number("F64"),
    eventChainId: s.keyword(),
  }),
});
```

No sorted sets or separate keys needed — the search index handles querying, sorting, and counting.

### Query Examples

```typescript
// List tweets, newest first
const results = await tweetIndex.query({
  filter: { timestamp: { $lte: beforeTs } },
  orderBy: { timestamp: "DESC" },
  limit: 20,
});

// Count tweets newer than a timestamp
const { count } = await tweetIndex.count({
  filter: { timestamp: { $gt: afterTs } },
});
```

## Backend Interface

```typescript
// lib/interfaces/tweets.ts

interface TweetInterface {
  // Write a tweet (called by event handlers)
  write(tweet: Omit<Tweet, "id" | "timestamp" | "likes">): Promise<Tweet>;

  // List tweets, paginated, newest first
  // Uses Redis Search: orderBy timestamp DESC, with filter for afterTs/beforeTs
  list(params: {
    afterTs?: number;
    beforeTs?: number;
    limit?: number;          // default 20
  }): Promise<{ tweets: Tweet[]; hasMore: boolean }>;

  // Get count of tweets newer than a timestamp (for "N new tweets" button)
  // Uses Redis Search: index.count() with filter timestamp > afterTs
  getNewCount(afterTs: number): Promise<number>;
}
```

## API Routes

### `GET /api/tweets`
Query params: `afterTs`, `beforeTs`, `limit`
Returns: `{ tweets: Tweet[], hasMore: boolean }`

### `GET /api/tweets/new-count`
Query params: `afterTs`
Returns: `{ count: number }`

## Personas

Personas are the fake accounts that tweet. They're defined in `lib/simulation/personas.ts`.

```typescript
interface Persona {
  id: string;
  handle: string;
  displayName: string;
  type: "regular" | "news" | "analyst" | "shitposter" | "insider" | "official";
  bio: string;
  traits: string[];          // affects tweet style: ["conspiracy", "bullish", "sarcastic"]
  sectors?: string[];        // sectors they tend to tweet about
}
```

### Persona Examples

```typescript
const PERSONAS: Persona[] = [
  {
    id: "goldbug-larry",
    handle: "@GoldBugLarry69",
    displayName: "Larry 🥇",
    type: "insider",
    bio: "Gold always goes up. Trust me bro.",
    traits: ["bullish-gold", "conspiracy", "dm-sender"],
  },
  {
    id: "breaking-global",
    handle: "@BreakingGlobal",
    displayName: "Breaking Global News",
    type: "news",
    bio: "First with the news. Sometimes accurate.",
    traits: ["neutral", "breaking"],
  },
  {
    id: "chad-investments",
    handle: "@ChadInvests",
    displayName: "Chad 📈",
    type: "analyst",
    bio: "Buy the dip. Always buy the dip.",
    traits: ["bullish", "overconfident"],
  },
  {
    id: "market-witch",
    handle: "@MarketWitch444",
    displayName: "Cassandra ✨",
    type: "shitposter",
    bio: "I predicted 47 of the last 2 crashes",
    traits: ["bearish", "dramatic", "astrological"],
  },
  {
    id: "official-gazette",
    handle: "@OfficialGazette",
    displayName: "The Global Gazette",
    type: "news",
    bio: "Award-winning journalism since 1847.",
    traits: ["neutral", "formal"],
  },
  {
    id: "degen-dave",
    handle: "@DegenDave420",
    displayName: "Dave 🎰",
    type: "shitposter",
    bio: "YOLO'd my rent into fish futures",
    traits: ["chaotic", "bullish", "meme"],
  },
  // ... 15-25 total personas
];
```

## Tweet Templates

Templates are functions that generate tweet content given event metadata. They're organized by event type.

```typescript
// lib/events/templates/tweets.ts

type TweetTemplate = (params: Record<string, string>) => string;

// Templates per event type, per persona type
const tweetTemplates: Record<string, Record<string, TweetTemplate[]>> = {
  "stock-rises": {
    analyst: [
      (p) => `${p.company} up ${p.percent}% today. Called it last week. You're welcome. 📈`,
      (p) => `If you're not in ${p.ticker} right now, I don't know what to tell you.`,
    ],
    shitposter: [
      (p) => `${p.ticker} TO THE MOON 🚀🚀🚀 MY LANDLORD CAN WAIT`,
      (p) => `me watching my ${p.ticker} position print money while my ex said I was "financially irresponsible" 😂`,
    ],
    news: [
      (p) => `MARKETS: ${p.company} (${p.ticker}) shares rise ${p.percent}% following ${p.reason}`,
    ],
  },
  "ceo-scandal": {
    regular: [
      (p) => `Wait the CEO of ${p.company} really quit because ${p.reason}?? 💀`,
      (p) => `${p.company} CEO drama is the funniest thing I've seen all week`,
    ],
    shitposter: [
      (p) => `${p.company} CEO be like: ${p.reason}\n\nBoard: 👁️👄👁️`,
      (p) => `POV: you're the ${p.company} board watching your CEO ${p.reason} during earnings call`,
    ],
  },
  "sector-boom": {
    analyst: [
      (p) => `${p.sector} sector entering a bull phase. Here's my thesis (thread):\n\n1/ ${p.reason}`,
    ],
    news: [
      (p) => `SECTOR WATCH: ${p.sector} index up ${p.percent}% as ${p.reason}`,
    ],
  },
  // ... many more
};

// Pick a random template for the event type and persona type
function generateTweet(
  eventType: string,
  personaType: string,
  params: Record<string, string>
): string {
  const templates = tweetTemplates[eventType]?.[personaType] ?? [];
  if (templates.length === 0) return `Something happened with ${params.company ?? "the market"}`;
  const template = templates[Math.floor(Math.random() * templates.length)];
  return template(params);
}
```

## Frontend Behavior

1. On mount, fetch latest 20 tweets
2. Every 10 seconds, call `GET /api/tweets/new-count?afterTs={latestTweetTs}`
3. If count > 0, show banner: "Show {count} new tweets"
4. On banner click, fetch new tweets with `afterTs` and prepend to feed
5. Infinite scroll: when near bottom, fetch older tweets with `beforeTs`
6. Like/unlike: stored in localStorage (`likedTweetIds` set), optimistic update in Zustand store — no API call
