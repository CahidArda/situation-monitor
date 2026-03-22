import type { Company, SectorStatus } from "@/lib/interfaces/types";

// ---------------------------------------------------------------------------
// Seeded PRNG (mulberry32)
// ---------------------------------------------------------------------------

function seededRandom(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Box-Muller transform for Gaussian random
// ---------------------------------------------------------------------------

function gaussianRandom(rng: () => number): number {
  const u1 = rng();
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1 || 0.0001)) * Math.cos(2 * Math.PI * u2);
}

// ---------------------------------------------------------------------------
// Geometric Brownian Motion increment
// ---------------------------------------------------------------------------

function brownianMotion(
  tick: number,
  seed: number,
  volatilityMultiplier: number,
): number {
  const rng = seededRandom(seed + tick);
  const dt = 1;
  const sigma = 0.02 * volatilityMultiplier;
  const mu = 0;
  const dW = Math.sqrt(dt) * gaussianRandom(rng);
  return mu * dt + sigma * dW;
}

// ---------------------------------------------------------------------------
// Stock price calculation
// ---------------------------------------------------------------------------

export function calculateStockPrice(
  company: Company,
  sectorIndexes: Record<string, number>,
  tick: number,
  seed: number,
): number {
  let price = company.baseValue;

  for (const { sectorId, weight } of company.sectors) {
    const indexValue = sectorIndexes[sectorId] ?? 100;
    const sectorInfluence = (indexValue - 100) / 100;
    price *= 1 + sectorInfluence * weight;
  }

  const noise = brownianMotion(tick, seed + hashString(company.id), company.volatilityMultiplier);
  price *= 1 + noise;

  return Math.max(price, 0.01);
}

// ---------------------------------------------------------------------------
// Commodity price calculation (tracks sector index directly)
// ---------------------------------------------------------------------------

export function calculateCommodityPrice(
  basePrice: number,
  sectorIndex: number,
  volatilityMultiplier: number,
  tick: number,
  seed: number,
  commodityId: string,
): number {
  const sectorInfluence = (sectorIndex - 100) / 100;
  let price = basePrice * (1 + sectorInfluence);

  const noise = brownianMotion(tick, seed + hashString(commodityId), volatilityMultiplier);
  price *= 1 + noise;

  return Math.max(price, 0.01);
}

// ---------------------------------------------------------------------------
// Sector index update
// ---------------------------------------------------------------------------

const STATUS_MULTIPLIERS: Record<SectorStatus, { drift: number; vol: number }> = {
  bull: { drift: 0.005, vol: 0.8 },
  bear: { drift: -0.005, vol: 0.8 },
  volatile: { drift: 0, vol: 2.0 },
  stable: { drift: 0.001, vol: 0.3 },
};

export function updateSectorIndex(
  indexValue: number,
  status: SectorStatus,
  baseVolatility: number,
  tick: number,
  seed: number,
  sectorId: string,
): number {
  const { drift, vol } = STATUS_MULTIPLIERS[status];
  const rng = seededRandom(seed + tick + hashString(sectorId));
  const randomComponent = (rng() - 0.5) * baseVolatility * vol * 0.01;
  const change = drift + randomComponent;
  return indexValue * (1 + change);
}

// ---------------------------------------------------------------------------
// Global index
// ---------------------------------------------------------------------------

export function calculateGlobalIndex(
  sectorIndexes: Record<string, number>,
): number {
  const values = Object.values(sectorIndexes);
  if (values.length === 0) return 100;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  return hash;
}
