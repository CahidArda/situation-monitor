import { redis } from "@/lib/redis";
import type { SectorStatus } from "@/lib/interfaces/types";

// ---------------------------------------------------------------------------
// Tick counter
// ---------------------------------------------------------------------------

export async function incrementTick(): Promise<number> {
  return redis.incr("sim:tick");
}

export async function getTick(): Promise<number> {
  return (await redis.get<number>("sim:tick")) ?? 0;
}

// ---------------------------------------------------------------------------
// Last event time (used by tick endpoint for cooldown)
// ---------------------------------------------------------------------------

export async function getLastEventTime(): Promise<number> {
  return (await redis.get<number>("sim:last_event_time")) ?? 0;
}

export async function setLastEventTime(): Promise<void> {
  await redis.set("sim:last_event_time", Date.now());
}

// ---------------------------------------------------------------------------
// Sector state (hash: sim:sector:{sectorId})
// ---------------------------------------------------------------------------

export async function getSectorStatus(
  sectorId: string,
): Promise<SectorStatus> {
  const status = await redis.hget(`sim:sector:${sectorId}`, "status");
  return (status as SectorStatus) ?? "stable";
}

export async function getSectorIndex(sectorId: string): Promise<number> {
  const val = await redis.hget(`sim:sector:${sectorId}`, "indexValue");
  return val ? Number(val) : 100;
}

export async function setSectorStatus(
  sectorId: string,
  status: SectorStatus,
): Promise<void> {
  await redis.hset(`sim:sector:${sectorId}`, { status });
}

export async function setSectorIndex(
  sectorId: string,
  indexValue: number,
): Promise<void> {
  await redis.hset(`sim:sector:${sectorId}`, { indexValue: String(indexValue) });
}

// ---------------------------------------------------------------------------
// Active chains
// ---------------------------------------------------------------------------

export async function getActiveChains(): Promise<string[]> {
  return (await redis.smembers("sim:active_chains")) ?? [];
}

export async function addActiveChain(chainId: string): Promise<void> {
  await redis.sadd("sim:active_chains", chainId);
}

export async function removeActiveChain(chainId: string): Promise<void> {
  await redis.srem("sim:active_chains", chainId);
}

export async function getActiveChainCount(): Promise<number> {
  return (await redis.scard("sim:active_chains")) ?? 0;
}
