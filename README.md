# Situation Monitor

A satirical stock-market/news simulation where CEOs resign over fishing rights, countries declare war over cheese tariffs, and insider tips come via DMs from shady characters named "GoldBug_Larry69."

The entire world is simulated. Real countries and cities, fake people. No LLMs — all content is template-driven.

## Setup

```bash
pnpm install
cp .env.local.example .env.local
# Fill in your Upstash Redis and QStash credentials
pnpm dev
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token |
| `QSTASH_TOKEN` | QStash token (for workflow triggers) |

## How It Works

1. Frontend polls `POST /api/tick` every 10 seconds
2. If >60s since last event, tick triggers a workflow via QStash
3. Workflow picks a random seed event (insider trading, CEO scandal, etc.)
4. Event chain unfolds over time: DM tip -> speculative tweet -> market move -> outcome
5. Frontend polls for new tweets/news/DMs and auto-shows them with highlights
6. Market prices update each tick via brownian motion + sector influence

The simulation only runs while someone has the app open.

## Adding Event Chains

Create a new file in `lib/events/chains/`:

```typescript
import { z } from "zod";
import { registerSeedEvent, registerEvent } from "../registry";

// 1. Define your chain metadata schema
const ChainSchema = z.object({ ... });

// 2. Register the seed event (entry point)
registerSeedEvent({
  name: "my-chain.setup",
  schema: z.object({}),
  weight: 5,          // relative probability
  cooldownSeconds: 120, // min time between fires
  handler: async (ctx) => {
    const meta = await ctx.run("setup", async () => {
      // All randomness and Redis writes MUST be inside ctx.run()
      return { ... };
    });
    return {
      followUpEvents: [
        { eventName: "my-chain.step-2", metadata: meta, delaySeconds: 15 },
      ],
    };
  },
});

// 3. Register follow-up events
registerEvent({
  name: "my-chain.step-2",
  schema: ChainSchema,
  handler: async (ctx, meta) => {
    // Write tweets, news, DMs inside ctx.run() steps
    // Use Promise.all for independent parallel steps
    await Promise.all([
      ctx.run("tweet", async () => { ... }),
      ctx.run("dm", async () => { ... }),
    ]);
    return { followUpEvents: [] }; // chain ends
  },
});
```

Then register it in `lib/events/registry.ts`:

```typescript
export async function loadAllChains() {
  // ...existing chains...
  await import("./chains/my-chain");
}
```

## Tech Stack

- **Next.js** (App Router) — framework
- **@upstash/redis** — database + Redis Search indexes
- **@upstash/workflow** — event execution with delays
- **@upstash/qstash** — workflow trigger
- **Zustand** — state management (persisted to localStorage)
- **TanStack Query** — data fetching + polling
- **shadcn/ui + Tailwind** — UI components
