# 03 — News Spec

## Overview

The news tab shows formal news articles produced by events. Unlike tweets (short, chaotic), news articles are structured with headlines, summaries, and body text. News accounts also tweet links to their articles.

## Data Model

```typescript
interface NewsArticle {
  id: string;                // nanoid
  headline: string;
  summary: string;           // 1-2 sentence summary
  body: string;              // full article text (can be multiple paragraphs)
  source: string;            // persona ID of the news org
  sourceDisplayName: string; // "The Global Gazette"
  category: "business" | "politics" | "world" | "markets" | "opinion" | "breaking";
  timestamp: number;
  relatedCompanies?: string[];  // company IDs mentioned
  relatedSectors?: string[];   // sector IDs mentioned
  eventChainId?: string;
  metadata?: Record<string, string>;
}
```

## Redis Schema

News articles are stored as JSON documents and indexed with Redis Search:

```typescript
import { s } from "@upstash/redis";

// Store each article as JSON
await redis.json.set(`news:${id}`, "$", article);

// Search index (created once at startup)
const newsIndex = await redis.search.createIndex({
  name: "idx:news",
  prefix: "news:",
  dataType: "json",
  schema: s.object({
    headline: s.string(),
    summary: s.string(),
    category: s.keyword(),
    timestamp: s.number("F64"),
    source: s.keyword(),
    eventChainId: s.keyword(),
  }),
});
```

No sorted sets or separate keys needed — the search index handles querying, sorting by timestamp, filtering by category, and counting.

### Query Examples

```typescript
// List news, newest first, filtered by category
const results = await newsIndex.query({
  filter: {
    $and: [
      { timestamp: { $lte: beforeTs } },
      { category: { $eq: "business" } },
    ],
  },
  orderBy: { timestamp: "DESC" },
  limit: 10,
});

// Get a single article by key
const article = await redis.json.get(`news:${id}`);
```

## Backend Interface

```typescript
// lib/interfaces/news.ts

interface NewsInterface {
  // Write a news article (called by event handlers)
  write(article: Omit<NewsArticle, "id" | "timestamp">): Promise<NewsArticle>;

  // List articles, paginated, newest first
  // Uses Redis Search: orderBy timestamp DESC, with optional category filter
  list(params: {
    afterTs?: number;
    beforeTs?: number;
    limit?: number;          // default 10
    category?: string;
  }): Promise<{ articles: NewsArticle[]; hasMore: boolean }>;

  // Get a single article by ID
  get(id: string): Promise<NewsArticle | null>;
}
```

## API Routes

### `GET /api/news`
Query params: `afterTs`, `beforeTs`, `limit`, `category`
Returns: `{ articles: NewsArticle[], hasMore: boolean }`

### `GET /api/news/[id]`
Returns: `NewsArticle`

## News Templates

```typescript
// lib/events/templates/news.ts

interface NewsTemplate {
  headline: (p: Record<string, string>) => string;
  summary: (p: Record<string, string>) => string;
  body: (p: Record<string, string>) => string;
  category: NewsArticle["category"];
}

const newsTemplates: Record<string, NewsTemplate[]> = {
  "ceo-resignation": [
    {
      headline: (p) => `${p.company} CEO ${p.ceoName} Steps Down Amid ${p.reason} Controversy`,
      summary: (p) => `The board of ${p.company} has accepted the resignation of CEO ${p.ceoName} following revelations about ${p.reason}. Shares moved ${p.direction} ${p.percent}% in after-hours trading.`,
      body: (p) => `${p.city}, ${p.country} — In a move that stunned the ${p.sector} industry, ${p.company} announced today that CEO ${p.ceoName} has tendered their resignation, effective immediately.

The departure comes after ${p.scandalDetail}. Sources close to the board describe the situation as "${p.boardReaction}."

${p.ceoName}, who took the helm of ${p.company} in ${p.yearAppointed}, released a brief statement: "${p.ceoStatement}"

Interim CEO ${p.interimCeo} will assume leadership while the board conducts a search for a permanent replacement. Industry analysts ${p.analystReaction}.

${p.company} shares (${p.ticker}) ${p.direction === "up" ? "rose" : "fell"} ${p.percent}% to ${p.price} in after-hours trading.`,
      category: "business",
    },
  ],
  "sector-report": [
    {
      headline: (p) => `${p.sector} Sector ${p.direction === "up" ? "Surges" : "Tumbles"} as ${p.reason}`,
      summary: (p) => `The ${p.sector} sector index moved ${p.direction} ${p.percent}% today, driven by ${p.reason}.`,
      body: (p) => `Global markets saw significant movement in the ${p.sector} sector today as ${p.reason}.

The sector index ${p.direction === "up" ? "gained" : "lost"} ${p.percent}% over the trading session, with major players including ${p.majorCompanies} ${p.direction === "up" ? "leading the charge" : "bearing the brunt"}.

Analysts point to ${p.catalyst} as the primary driver. "${p.analystQuote}," said ${p.analystName} of ${p.firmName}.

The movement has implications for the broader market, with the global index shifting ${p.globalDirection} ${p.globalPercent}% in sympathy.`,
      category: "markets",
    },
  ],
  "diplomatic-incident": [
    {
      headline: (p) => `${p.country1} and ${p.country2} Clash Over ${p.issue}`,
      summary: (p) => `Diplomatic tensions rose between ${p.country1} and ${p.country2} after ${p.incident}. Markets in both regions reacted sharply.`,
      body: (p) => `${p.city}, ${p.country1} — Relations between ${p.country1} and ${p.country2} deteriorated sharply today after ${p.incident}.

${p.official1Name}, the ${p.official1Title} of ${p.country1}, called the situation "${p.quote1}." In response, ${p.official2Name} of ${p.country2} described it as "${p.quote2}."

The dispute centers on ${p.issueDetail}. Observers note that this marks an escalation from ${p.previousIncident}.

Markets in both regions reacted, with ${p.affectedSectors} sectors seeing immediate movement. The ${p.mainIndex} index shifted ${p.indexDirection} ${p.indexPercent}%.`,
      category: "world",
    },
  ],
  "arrest": [
    {
      headline: (p) => `${p.personName} Arrested on ${p.charges} Charges`,
      summary: (p) => `Prominent ${p.role} ${p.personName} was arrested today in ${p.city} on charges of ${p.charges}.`,
      body: (p) => `${p.city}, ${p.country} — ${p.personName}, known for ${p.knownFor}, was taken into custody by ${p.authority} early this morning on charges of ${p.charges}.

The arrest follows ${p.investigation}. ${p.personName}'s lawyer, ${p.lawyerName}, stated that their client "${p.lawyerQuote}."

The case has drawn attention due to ${p.significance}. ${p.additionalContext}`,
      category: "breaking",
    },
  ],
  // ... more templates: merger-announcement, product-launch, market-crash-report,
  //     government-policy, natural-disaster-impact, etc.
};
```

## Frontend Behavior

1. News tab polls every 15 seconds for new articles
2. Articles displayed as cards: headline + summary + source + timestamp
3. Clicking an article expands it to show the full body text
4. Optional category filter tabs at top of news panel
5. Unread count badge on the News tab when new articles arrive
