import { redis } from "@/lib/redis";
import { ticksToSeconds } from "@/lib/constants";
import type { SeedEventDefinition } from "@/lib/interfaces/events";

// ---------------------------------------------------------------------------
// All seed events — imported directly, no registration needed
// ---------------------------------------------------------------------------

import { noiseTweet, timeTraveler, yodaTrader } from "./chains/noise";
import { insiderTrading } from "./chains/insider-trading";
import { ceoScandal } from "./chains/ceo-scandal";
import { diplomaticIncident } from "./chains/diplomatic-incident";
import { pumpAndDump } from "./chains/pump-and-dump";
import { productLaunch } from "./chains/product-launch";
import { marketBoom } from "./chains/market-boom";

const ALL_SEEDS: SeedEventDefinition[] = [
  noiseTweet,
  timeTraveler,
  yodaTrader,
  insiderTrading,
  ceoScandal,
  diplomaticIncident,
  pumpAndDump,
  productLaunch,
  marketBoom,
];

// ---------------------------------------------------------------------------
// Seed selection — weighted random with cooldown and condition checks
// ---------------------------------------------------------------------------

export async function selectSeedEvent(): Promise<SeedEventDefinition | null> {
  const eligible: SeedEventDefinition[] = [];

  for (const seed of ALL_SEEDS) {
    const cooldownKey = `sim:seed:cooldown:${seed.name}`;
    const lastFired = await redis.get(cooldownKey);
    if (lastFired) continue;

    if (seed.requiredConditions) {
      const ok = await seed.requiredConditions();
      if (!ok) continue;
    }

    eligible.push(seed);
  }

  if (eligible.length === 0) return null;

  const totalWeight = eligible.reduce((sum, s) => sum + s.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const seed of eligible) {
    roll -= seed.weight;
    if (roll <= 0) {
      await redis.set(
        `sim:seed:cooldown:${seed.name}`,
        Date.now(),
        { ex: ticksToSeconds(seed.cooldownTicks) },
      );
      return seed;
    }
  }

  return eligible[0];
}

export function getSeedByName(name: string): SeedEventDefinition | undefined {
  return ALL_SEEDS.find((s) => s.name === name);
}
