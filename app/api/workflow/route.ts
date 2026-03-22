import { serve } from "@upstash/workflow/nextjs";
import { loadAllChains, selectSeedEvent, getEvent } from "@/lib/events/registry";
import { incrementTick, setLastEventTime } from "@/lib/events/state";
import { getTweetIndex, getNewsIndex, getDMIndex } from "@/lib/search";
import type { EventResult } from "@/lib/interfaces/events";
import type { WorkflowContext } from "@upstash/workflow";

export const { POST } = serve(async (ctx) => {
  // Ensure all chains are registered
  await loadAllChains();

  const trigger = ctx.requestPayload as { type: "seed" | "event"; eventName?: string; metadata?: unknown };

  if (trigger.type === "seed") {
    await ctx.run("increment-tick", () => incrementTick());
    await ctx.run("set-last-event-time", () => setLastEventTime());

    const seedName = await ctx.run("select-seed", async () => {
      const selected = await selectSeedEvent();
      return selected?.name ?? null;
    });
    if (!seedName) return; // no eligible seed

    const seed = getEvent(seedName);
    if (!seed) return;

    const result = await seed.handler(ctx, {});
    await executeFollowUps(ctx, result.followUpEvents);
  }

  if (trigger.type === "event" && trigger.eventName) {
    const event = getEvent(trigger.eventName);
    if (!event) return;

    const result = await event.handler(ctx, trigger.metadata);
    await executeFollowUps(ctx, result.followUpEvents);
  }

  // Wait for all search indexes to finish processing new documents
  await ctx.run("wait-indexing", async () => {
    await Promise.all([
      getTweetIndex().waitIndexing(),
      getNewsIndex().waitIndexing(),
      getDMIndex().waitIndexing(),
    ]);
  });
});

async function executeFollowUps(
  ctx: WorkflowContext,
  events: EventResult["followUpEvents"],
) {
  if (events.length === 0) return;

  const immediate = events.filter((e) => !e.delaySeconds);
  const delayed = events.filter((e) => e.delaySeconds);

  // Execute immediate follow-ups in parallel
  // Handlers are called directly (not inside ctx.run) because they
  // contain their own ctx.run steps internally for idempotency.
  if (immediate.length > 0) {
    const results = await Promise.all(
      immediate.map(async (event) => {
        const def = getEvent(event.eventName);
        if (!def) return { followUpEvents: [] } as EventResult;
        return def.handler(ctx, event.metadata);
      }),
    );

    const nextEvents = results.flatMap((r) => r.followUpEvents);
    await executeFollowUps(ctx, nextEvents);
  }

  // Schedule delayed events sequentially
  for (const event of delayed) {
    await ctx.sleep(`delay-${event.eventName}`, event.delaySeconds!);
    const def = getEvent(event.eventName);
    if (!def) continue;
    const result = await def.handler(ctx, event.metadata);
    await executeFollowUps(ctx, result.followUpEvents);
  }
}
