import type { z } from "zod";
import { redis } from "@/lib/redis";
import type { EventDefinition, SeedEventDefinition } from "@/lib/interfaces/events";

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const eventRegistry = new Map<string, EventDefinition<z.ZodType>>();
const seedEvents: SeedEventDefinition<z.ZodType>[] = [];

export function registerEvent<T extends z.ZodType>(def: EventDefinition<T>) {
  eventRegistry.set(def.name, def as EventDefinition<z.ZodType>);
}

export function registerSeedEvent<T extends z.ZodType>(
  def: SeedEventDefinition<T>,
) {
  eventRegistry.set(def.name, def as EventDefinition<z.ZodType>);
  seedEvents.push(def as SeedEventDefinition<z.ZodType>);
}

export function getEvent(name: string) {
  return eventRegistry.get(name);
}

// ---------------------------------------------------------------------------
// Seed selection — weighted random with cooldown and condition checks
// ---------------------------------------------------------------------------

export async function selectSeedEvent(): Promise<SeedEventDefinition<z.ZodType> | null> {
  const eligible: SeedEventDefinition<z.ZodType>[] = [];

  for (const seed of seedEvents) {
    // Check cooldown
    const cooldownKey = `sim:seed:cooldown:${seed.name}`;
    const lastFired = await redis.get(cooldownKey);
    if (lastFired) continue; // still in cooldown

    // Check conditions
    if (seed.requiredConditions) {
      const ok = await seed.requiredConditions();
      if (!ok) continue;
    }

    eligible.push(seed);
  }

  if (eligible.length === 0) return null;

  // Weighted random selection
  const totalWeight = eligible.reduce((sum, s) => sum + s.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const seed of eligible) {
    roll -= seed.weight;
    if (roll <= 0) {
      // Set cooldown TTL
      await redis.set(
        `sim:seed:cooldown:${seed.name}`,
        Date.now(),
        { ex: seed.cooldownSeconds },
      );
      return seed;
    }
  }

  return eligible[0];
}

// ---------------------------------------------------------------------------
// Ensure all chain modules are imported (side-effect registration)
// ---------------------------------------------------------------------------

export async function loadAllChains() {
  await import("./chains/noise");
  await import("./chains/insider-trading");
  await import("./chains/ceo-scandal");
  await import("./chains/diplomatic-incident");
  await import("./chains/pump-and-dump");
  await import("./chains/product-launch");
}
