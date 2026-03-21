# 04 — DMs Spec

## Overview

The DM tab is where insider characters send speculative messages about future market events. Some tips are correct (giving the user a genuine advantage), some are wrong (leading them astray). DMs create a feeling of being "in the know" — the quintessential monitoring-the-situation experience.

DMs are **global broadcast messages** — the simulation generates them as part of event chains, and all users see the same DM conversations. Read/unread status is tracked in the frontend via localStorage.

## Data Model

```typescript
interface DirectMessage {
  id: string;              // nanoid
  fromPersonaId: string;   // persona who sent it
  fromHandle: string;
  fromDisplayName: string;
  content: string;
  timestamp: number;
  type: "tip" | "followup" | "brag" | "panic" | "casual";
  metadata?: {
    eventChainId?: string;
    relatedCompany?: string;
    relatedSector?: string;
    tipAccuracy?: "correct" | "incorrect" | "unknown"; // revealed later
  };
}

// Conversation summary (derived from DM data)
interface DMConversation {
  personaId: string;
  personaHandle: string;
  personaDisplayName: string;
  lastMessage: string;
  lastTimestamp: number;
}
```

## Redis Schema

DMs are stored as JSON documents and indexed with Redis Search:

```typescript
import { s } from "@upstash/redis";

// Store each DM as JSON
await redis.json.set(`dm:${id}`, "$", dm);

// Search index (created once at startup)
const dmIndex = await redis.search.createIndex({
  name: "idx:dms",
  prefix: "dm:",
  dataType: "json",
  schema: s.object({
    fromPersonaId: s.keyword(),
    fromHandle: s.keyword(),
    timestamp: s.number("F64"),
    type: s.keyword(),
    content: s.string(),
  }),
});
```

### Query Examples

```typescript
// List messages from a persona, newest first
const results = await dmIndex.query({
  filter: { fromPersonaId: { $eq: personaId } },
  orderBy: { timestamp: "DESC" },
  limit: 20,
});

// List unique conversations (latest message per persona)
// Option A: query all, group client-side
// Option B: use aggregation
const convos = await dmIndex.aggregate({
  aggregations: {
    byPersona: {
      $terms: { field: "fromPersonaId", size: 50 },
      $aggs: {
        latestTs: { $max: { field: "timestamp" } },
      },
    },
  },
});
```

## Backend Interface

```typescript
// lib/interfaces/dms.ts

interface DMInterface {
  // Send a DM (called by event handlers)
  send(params: {
    fromPersonaId: string;
    content: string;
    type: DirectMessage["type"];
    metadata?: DirectMessage["metadata"];
  }): Promise<DirectMessage>;

  // List conversations (unique personas with their latest message)
  listConversations(): Promise<DMConversation[]>;

  // List messages in a conversation
  // Uses Redis Search: filter by fromPersonaId, orderBy timestamp DESC
  listMessages(
    personaId: string,
    params?: { limit?: number; beforeTs?: number }
  ): Promise<{ messages: DirectMessage[]; hasMore: boolean }>;
}
```

## API Routes

### `GET /api/dms`
Returns: `{ conversations: DMConversation[] }`

### `GET /api/dms/[personaId]`
Query params: `limit`, `beforeTs`
Returns: `{ messages: DirectMessage[], hasMore: boolean }`

## DM Templates

```typescript
// lib/events/templates/dms.ts

const dmTemplates: Record<string, Record<DirectMessage["type"], ((p: Record<string, string>) => string)[]>> = {
  "insider-trading": {
    tip: [
      (p) => `Hey... you didn't hear this from me, but ${p.company} is about to ${p.prediction}. My cousin works in their ${p.department}. Just saying. 👀`,
      (p) => `I have it on VERY good authority that ${p.ticker} is going to ${p.direction} big time. Don't ask how I know.`,
      (p) => `Bro. BRO. Load up on ${p.ticker}. Trust me on this one. Something HUGE is coming. I literally cannot say more.`,
    ],
    followup: [
      (p) => `Did you see ${p.ticker}?? I TOLD you. You owe me a coffee ☕`,
      (p) => `So... about that ${p.ticker} tip... I may have been slightly wrong. My bad 😬`,
    ],
    brag: [
      (p) => `Made ${p.amount} on that ${p.ticker} play. I'm literally a genius.`,
      (p) => `That's 5 in a row I've called correctly. They should give me a Bloomberg terminal.`,
    ],
    panic: [
      (p) => `OK so ${p.ticker} did not go the direction I said. I am absolutely NOT panicking right now. Everything is fine. 🔥`,
      (p) => `I may have lost everything on ${p.ticker}. If anyone asks, I was never here.`,
      (p) => `bro I'm so cooked. ${p.ticker} just ${p.direction}ed ${p.percent}% and I was on the wrong side. my wife is going to kill me`,
    ],
    casual: [
      (p) => `What do you think about ${p.sector} right now? I'm seeing some interesting moves.`,
      (p) => `You watching the ${p.sector} sector? Something feels off.`,
    ],
  },
  "market-manipulation": {
    tip: [
      (p) => `Listen... I know a guy who knows a guy at ${p.company}. They're about to announce ${p.announcement}. This is going to move the needle BIG time.`,
      (p) => `I'm going ALL IN on ${p.ticker} tomorrow morning. Going to tweet about it too. Just giving you a heads up first 😉`,
    ],
    followup: [
      (p) => `Posted my ${p.ticker} tweet. Let's see if the crowd follows. 🐑`,
      (p) => `${p.ticker} is moving!! The sheep are buying!! 🐑📈`,
    ],
    panic: [
      (p) => `So the authorities may be looking into my ${p.ticker} posts. If they ask, we never spoke.`,
      (p) => `DELETE YOUR MESSAGES ABOUT ${p.ticker}. Actually wait, does this app even have that feature? Oh no.`,
    ],
    brag: [],
    casual: [],
  },
};
```

## Insider Personas (DM Senders)

A subset of personas are designated as DM senders. They have personality traits that affect message style:

```typescript
const DM_PERSONAS = [
  "goldbug-larry",       // gold obsessed, 60% accuracy
  "crypto-karen",        // "decentralized" everything, 40% accuracy
  "hedge-fund-hank",     // pretends to be sophisticated, 70% accuracy
  "senator-leak",        // "accidentally" leaks policy info, 80% accuracy
  "degen-dave",          // YOLO energy, 30% accuracy
  "quiet-quant",         // mysterious, few words, 90% accuracy
];
```

## Frontend Behavior

1. DM icon in the tab bar shows unread count badge (tracked in localStorage)
2. Inbox view: list of conversations sorted by most recent
3. Click conversation → message thread view
4. Auto-mark as read in localStorage when conversation is opened
5. New DM notification: if tab is not active, increment badge; if open, add message to view
6. Poll for new DMs every 10 seconds
7. Unread state is per-conversation, stored as `{ [personaId]: lastReadTimestamp }` in localStorage
