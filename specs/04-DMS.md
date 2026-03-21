# 04 — DMs Spec

## Overview

The DM tab is where insider characters send the user speculative messages about future market events. Some tips are correct (giving the user a genuine advantage), some are wrong (leading them astray). DMs create a feeling of being "in the know" — the quintessential monitoring-the-situation experience.

## Data Model

```typescript
interface DirectMessage {
  id: string;              // nanoid
  fromPersonaId: string;   // persona who sent it
  fromHandle: string;
  fromDisplayName: string;
  fromAvatar: string;
  content: string;
  timestamp: number;
  read: boolean;
  type: "tip" | "followup" | "brag" | "panic" | "casual";
  metadata?: {
    eventChainId?: string;
    relatedCompany?: string;
    relatedSector?: string;
    tipAccuracy?: "correct" | "incorrect" | "unknown"; // revealed later
  };
}

// A conversation is a list of DMs from one persona
interface DMConversation {
  personaId: string;
  personaHandle: string;
  personaDisplayName: string;
  personaAvatar: string;
  lastMessage: string;
  lastTimestamp: number;
  unreadCount: number;
}
```

## Redis Schema

```
dm:{userId}:{personaId}:messages  → Sorted Set (score = timestamp, member = DM ID)
dm:{userId}:msg:{dmId}           → JSON string of DirectMessage
dm:{userId}:conversations        → Sorted Set (score = lastTimestamp, member = personaId)
dm:{userId}:unread:{personaId}   → number (unread count)
dm:{userId}:unread:total         → number (total unread across all convos)
```

## Backend Interface

```typescript
// lib/interfaces/dms.ts

interface DMInterface {
  // Send a DM to a user (called by event handlers)
  // targetUserId can be "broadcast" to send to ALL active users
  send(params: {
    targetUserId: string | "broadcast";
    fromPersonaId: string;
    content: string;
    type: DirectMessage["type"];
    metadata?: DirectMessage["metadata"];
  }): Promise<DirectMessage>;

  // List conversations for a user (inbox view)
  listConversations(userId: string): Promise<DMConversation[]>;

  // List messages in a conversation
  listMessages(
    userId: string,
    personaId: string,
    params?: { limit?: number; beforeTs?: number }
  ): Promise<{ messages: DirectMessage[]; hasMore: boolean }>;

  // Mark conversation as read
  markRead(userId: string, personaId: string): Promise<void>;

  // Get total unread count
  getUnreadCount(userId: string): Promise<number>;
}
```

### Note on "broadcast" DMs

When an event sends a DM with `targetUserId: "broadcast"`, we need to send it to all active users. Active users are tracked:

```
sim:active_users → Set of user IDs (add on any API call, expire with TTL)
```

Each user ID is added to this set with a 1-hour TTL on their individual tracking key. On broadcast, iterate the set and write a DM for each user.

## API Routes

### `GET /api/dms`
Headers: `x-user-id`
Returns: `{ conversations: DMConversation[], totalUnread: number }`

### `GET /api/dms/[personaId]`
Headers: `x-user-id`
Query params: `limit`, `beforeTs`
Returns: `{ messages: DirectMessage[], hasMore: boolean }`

### `POST /api/dms/[personaId]/read`
Headers: `x-user-id`
Marks conversation as read.

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

1. DM icon in the tab bar shows unread count badge
2. Inbox view: list of conversations sorted by most recent
3. Click conversation → message thread view
4. Auto-mark as read when conversation is opened
5. New DM notification: if tab is not active, increment badge; if open, add message in real-time
6. Poll for new DMs every 10 seconds
