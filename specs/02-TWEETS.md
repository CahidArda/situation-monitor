# 02 — Tweets Spec

## Overview

The tweet feed is the left panel of the app — a Twitter-like stream of posts from simulated accounts. Tweets come from personas (fake people/orgs), triggered by events. The feed auto-checks for new tweets every 10 seconds and shows a "N new tweets" button.

## Data Model

```typescript
interface Tweet {
  id: string;              // nanoid
  authorId: string;        // persona ID
  authorHandle: string;    // e.g. "@GoldBugLarry69"
  authorDisplayName: string;
  authorAvatar: string;    // emoji or initials
  authorVerified: boolean;
  content: string;
  timestamp: number;       // unix ms
  likes: number;
  retweets: number;        // simulated count (not real feature)
  tags: string[];          // for filtering: ["market", "scandal", "speculation"]
  replyToId?: string;      // thread support (optional, v2)
  newsLink?: {             // if tweet links to a news article
    newsId: string;
    headline: string;
  };
  eventChainId?: string;   // which event chain produced this tweet
  metadata?: Record<string, string>; // flexible extra data
}
```

## Redis Schema

```
tweet:{id}              → JSON string of Tweet object
tweets:feed             → Sorted Set (score = timestamp, member = tweet ID)
tweets:latest_ts        → number (timestamp of most recent tweet)
user:{userId}:likes     → Set of tweet IDs the user has liked
```

## Backend Interface

```typescript
// lib/interfaces/tweets.ts

interface TweetInterface {
  // Write a tweet (called by event handlers)
  write(tweet: Omit<Tweet, "id" | "timestamp" | "likes" | "retweets">): Promise<Tweet>;

  // List tweets, paginated, newest first
  // afterTs: only return tweets newer than this timestamp (for polling)
  // beforeTs: for loading older tweets (infinite scroll)
  // limit: max tweets to return
  list(params: {
    afterTs?: number;
    beforeTs?: number;
    limit?: number;          // default 20
  }): Promise<{ tweets: Tweet[]; hasMore: boolean }>;

  // Like/unlike (user action)
  like(tweetId: string, userId: string): Promise<void>;
  unlike(tweetId: string, userId: string): Promise<void>;

  // Check which tweets in a list the user has liked
  getLikedStatus(tweetIds: string[], userId: string): Promise<Record<string, boolean>>;

  // Get count of tweets newer than a timestamp (for "N new tweets" button)
  getNewCount(afterTs: number): Promise<number>;
}
```

## API Routes

### `GET /api/tweets`
Query params: `afterTs`, `beforeTs`, `limit`
Headers: `x-user-id`
Returns: `{ tweets: Tweet[], hasMore: boolean, likedByUser: Record<string, boolean> }`

### `POST /api/tweets/like`
Body: `{ tweetId: string }`
Headers: `x-user-id`

### `DELETE /api/tweets/like`
Body: `{ tweetId: string }`
Headers: `x-user-id`

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
  avatar: string;            // emoji
  verified: boolean;
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
    avatar: "🥇",
    verified: false,
    type: "insider",
    bio: "Gold always goes up. Trust me bro.",
    traits: ["bullish-gold", "conspiracy", "dm-sender"],
  },
  {
    id: "breaking-global",
    handle: "@BreakingGlobal",
    displayName: "Breaking Global News",
    avatar: "🌍",
    verified: true,
    type: "news",
    bio: "First with the news. Sometimes accurate.",
    traits: ["neutral", "breaking"],
  },
  {
    id: "chad-investments",
    handle: "@ChadInvests",
    displayName: "Chad 📈",
    avatar: "📈",
    verified: false,
    type: "analyst",
    bio: "Buy the dip. Always buy the dip.",
    traits: ["bullish", "overconfident"],
  },
  {
    id: "market-witch",
    handle: "@MarketWitch444",
    displayName: "Cassandra ✨",
    avatar: "🔮",
    verified: false,
    type: "shitposter",
    bio: "I predicted 47 of the last 2 crashes",
    traits: ["bearish", "dramatic", "astrological"],
  },
  {
    id: "official-gazette",
    handle: "@OfficialGazette",
    displayName: "The Global Gazette",
    avatar: "📰",
    verified: true,
    type: "news",
    bio: "Award-winning journalism since 1847.",
    traits: ["neutral", "formal"],
  },
  {
    id: "degen-dave",
    handle: "@DegenDave420",
    displayName: "Dave 🎰",
    avatar: "🎰",
    verified: false,
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
6. Like/unlike: optimistic update in Zustand store, fire API call in background
