import { serve } from "@upstash/workflow/nextjs";
import { selectSeedEvent, getSeedByName } from "@/lib/events/registry";
import { incrementTick, setLastEventTime } from "@/lib/events/state";
import { market } from "@/lib/market/market";
import { getTweetIndex, getNewsIndex, getDMIndex } from "@/lib/search";

export const { POST } = serve(async (ctx) => {
  await ctx.run("increment-tick", () => incrementTick());
  await ctx.run("set-last-event-time", () => setLastEventTime());
  await ctx.run("market-tick", () => market.tick());

  const seedName = await ctx.run("select-seed", async () => {
    const selected = await selectSeedEvent();
    return selected?.name ?? null;
  });

  if (!seedName) return;

  const seed = getSeedByName(seedName);
  if (!seed) return;

  await seed.handler(ctx);

  await ctx.run("wait-indexing", () =>
    Promise.all([
      getTweetIndex().waitIndexing(),
      getNewsIndex().waitIndexing(),
      getDMIndex().waitIndexing(),
    ]),
  );
});
