# 01 — Event System Spec

## Overview

The simulation is entirely event-driven. Every tweet, news article, DM, price change, and market shift originates from an event. Events are composable — a single seed event can cascade into a chain of follow-up events that unfold over time.

## Event Definition

```typescript
import { z } from "zod";
import { WorkflowContext } from "@upstash/workflow";

// Every event in the registry has this shape
interface EventDefinition<T extends z.ZodType> {
  name: string;                    // unique identifier: "insider-trading.rumor-dm"
  description: string;             // human-readable description
  schema: T;                       // Zod schema for event metadata
  handler: (
    ctx: WorkflowContext,
    metadata: z.infer<T>,
    simState: SimulationState
  ) => Promise<EventResult>;
}

// What a handler returns
interface EventResult {
  // Follow-up events to trigger (can be empty = chain ends)
  followUpEvents: Array<{
    eventName: string;
    metadata: unknown;        // must conform to target event's schema
    delaySeconds?: number;    // optional: wait before triggering
  }>;
}

// Passed to every handler so it can read current world state
interface SimulationState {
  currentTick: number;            // monotonically increasing counter
  marketStatus: Record<string, SectorStatus>; // sectorId -> status
  activeChains: string[];         // IDs of currently-running event chains
}

type SectorStatus = "bull" | "bear" | "volatile" | "stable";
```

## Event Registry

A central map from event name to its definition:

```typescript
// lib/events/registry.ts

const eventRegistry = new Map<string, EventDefinition<any>>();

function registerEvent<T extends z.ZodType>(def: EventDefinition<T>) {
  eventRegistry.set(def.name, def);
}

function getEvent(name: string): EventDefinition<any> | undefined {
  return eventRegistry.get(name);
}
```

Events register themselves on module load. Each chain file (e.g., `insider-trading.ts`) calls `registerEvent()` for each event in the chain.

## Seed Events

Seed events are the entry points. They're selected randomly by the periodic trigger. Each seed event starts a new chain.

```typescript
// Seed events are just events tagged as seeds
interface SeedEventDefinition<T extends z.ZodType> extends EventDefinition<T> {
  weight: number;           // relative probability of being selected
  cooldownSeconds: number;  // minimum time between two firings of this seed
  requiredConditions?: (state: SimulationState) => boolean; // optional guard
}

const seedEvents: SeedEventDefinition<any>[] = [];
```

### Seed Selection

When the periodic trigger fires:
1. Filter seeds by cooldown (skip if fired too recently — tracked in Redis)
2. Filter by `requiredConditions`
3. Weighted random selection among remaining seeds
4. If multiple seeds qualify and RNG permits, fire 1–2 seeds simultaneously

## Workflow Integration

The `/api/workflow` endpoint is the single entry point for @upstash/workflow.

```typescript
// api/workflow/route.ts (pseudocode)
import { serve } from "@upstash/workflow/nextjs";

export const { POST } = serve(async (ctx) => {
  // Step 1: Determine what triggered us
  const trigger = ctx.requestPayload as WorkflowTrigger;

  if (trigger.type === "seed") {
    // Periodic trigger — pick a random seed event
    const seed = await ctx.run("select-seed", () => selectSeedEvent());
    const metadata = await ctx.run("generate-seed-meta", () =>
      generateSeedMetadata(seed)
    );
    // Execute the seed and get follow-ups
    const result = await seed.handler(ctx, metadata, await getSimState());

    // Execute follow-ups (potentially in parallel)
    await executeFollowUps(ctx, result.followUpEvents);
  }

  if (trigger.type === "event") {
    // Direct event trigger (from follow-up)
    const event = getEvent(trigger.eventName);
    const result = await event.handler(ctx, trigger.metadata, await getSimState());
    await executeFollowUps(ctx, result.followUpEvents);
  }
});

async function executeFollowUps(
  ctx: WorkflowContext,
  events: EventResult["followUpEvents"]
) {
  if (events.length === 0) return;

  // Group: immediate vs delayed
  const immediate = events.filter(e => !e.delaySeconds);
  const delayed = events.filter(e => e.delaySeconds);

  // Execute immediate follow-ups in parallel
  if (immediate.length > 0) {
    const results = await Promise.all(
      immediate.map(async (event, i) => {
        const def = getEvent(event.eventName)!;
        return ctx.run(`followup-${event.eventName}-${i}`, async () => {
          return def.handler(ctx, event.metadata, await getSimState());
        });
      })
    );

    // Recursively process any follow-ups from the follow-ups
    const nextEvents = results.flatMap(r => r.followUpEvents);
    await executeFollowUps(ctx, nextEvents);
  }

  // Schedule delayed events via ctx.sleepUntil or ctx.sleep
  for (const event of delayed) {
    await ctx.sleep(`delay-${event.eventName}`, event.delaySeconds!);
    const def = getEvent(event.eventName)!;
    const result = await def.handler(ctx, event.metadata, await getSimState());
    await executeFollowUps(ctx, result.followUpEvents);
  }
}
```

### Important Workflow Notes

- Each `ctx.run()` is an idempotent step — safe for retries
- Side effects (writing tweets, news, DMs to Redis) happen inside `ctx.run()` steps
- Delays use `ctx.sleep()` — the workflow pauses and resumes after the delay
- Long-running chains (bull/bear market transitions) use long sleep durations

## QStash Schedule

The `/api/schedule` endpoint sets up (or verifies) the periodic QStash schedule:

```typescript
// POST /api/schedule
// Requires SCHEDULE_SECRET env var for auth

// On call:
// 1. Check if schedule already exists (store schedule ID in Redis)
// 2. If not, create QStash schedule:
//    - URL: /api/workflow
//    - body: { type: "seed" }
//    - cron: every 20 seconds (or configurable)
// 3. Return schedule ID
```

The schedule fires every ~20 seconds. Not every fire produces a seed event — the seed selection logic may decide conditions aren't met or apply cooldowns.

## Simulation State in Redis

```
sim:tick                     → number (incremented each workflow run)
sim:sector:{sectorId}:status → "bull" | "bear" | "volatile" | "stable"
sim:seed:cooldown:{seedName} → timestamp of last fire (TTL = cooldown)
sim:active_chains            → Set of chain IDs currently in progress
```

## Event Naming Convention

Events use dot-separated names: `{chain}.{step}`

Examples:
- `insider-trading.rumor-dm`
- `insider-trading.public-tweet`
- `insider-trading.outcome-arrest`
- `insider-trading.outcome-broke`
- `ceo-scandal.initial-rumor`
- `ceo-scandal.press-conference`
- `market-shift.sector-boom`
- `market-shift.sector-crash`
