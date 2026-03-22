import { redis } from "@/lib/redis";
import { COMPANIES } from "./companies";
import { SECTORS } from "./sectors";
import { COMMODITIES } from "./commodities";
import {
  calculateStockPrice,
  calculateCommodityPrice,
  updateSectorIndex as calcSectorIndex,
  calculateGlobalIndex,
} from "./pricing";
import {
  getSectorStatus,
  getSectorIndex,
  setSectorIndex,
  setSectorStatus,
} from "@/lib/events/state";
import { CHANGE_LOOKBACK_TICKS } from "@/lib/constants";
import type { MarketInterface, CompanyWithPrice, CommodityWithPrice, SectorWithState } from "@/lib/interfaces/market";
import type { SectorStatus } from "@/lib/interfaces/types";

const HISTORY_MAX = 200;

// Initial sector values — varied to make the market interesting from the start
const INITIAL_SECTOR_STATE: Record<string, { indexValue: number; status: SectorStatus }> = {
  energy: { indexValue: 112, status: "bull" },
  tech: { indexValue: 95, status: "volatile" },
  agriculture: { indexValue: 104, status: "stable" },
  defense: { indexValue: 108, status: "bull" },
  finance: { indexValue: 98, status: "bear" },
  luxury: { indexValue: 115, status: "bull" },
  mining: { indexValue: 88, status: "bear" },
  shipping: { indexValue: 101, status: "stable" },
  entertainment: { indexValue: 92, status: "volatile" },
};

async function getMarketTick(): Promise<number> {
  return (await redis.get<number>("market:tick")) ?? 0;
}

async function getMarketSeed(): Promise<number> {
  let seed = await redis.get<number>("market:seed");
  if (seed == null) {
    seed = Math.floor(Math.random() * 1_000_000);
    await redis.set("market:seed", seed);
  }
  return seed;
}

async function getSectorIndexes(): Promise<Record<string, number>> {
  const results = await Promise.all(
    SECTORS.map((s) => getSectorIndex(s.id)),
  );
  const indexes: Record<string, number> = {};
  SECTORS.forEach((s, i) => { indexes[s.id] = results[i]; });
  return indexes;
}

const CHANGE_LOOKBACK = CHANGE_LOOKBACK_TICKS;

async function getPreviousPrices(): Promise<Record<string, number>> {
  const prices: Record<string, number> = {};
  const tick = await getMarketTick();
  if (tick <= CHANGE_LOOKBACK) return prices;

  // Read prices from CHANGE_LOOKBACK ticks ago in parallel
  const offset = -(CHANGE_LOOKBACK + 1); // 0-indexed from end
  const [companyResults, commodityResults, globalPrev] = await Promise.all([
    Promise.all(COMPANIES.map((c) =>
      redis.zrange<string[]>(`market:history:company:${c.id}`, offset, offset),
    )),
    Promise.all(COMMODITIES.map((c) =>
      redis.zrange<string[]>(`market:history:commodity:${c.id}`, offset, offset),
    )),
    redis.zrange<string[]>("market:history:global", offset, offset),
  ]);

  COMPANIES.forEach((c, i) => {
    const prev = companyResults[i];
    if (prev && prev.length > 0) prices[c.id] = Number(prev[0]);
  });
  COMMODITIES.forEach((c, i) => {
    const prev = commodityResults[i];
    if (prev && prev.length > 0) prices[c.id] = Number(prev[0]);
  });
  if (globalPrev && globalPrev.length > 0) prices["__global"] = Number(globalPrev[0]);

  return prices;
}

export const market: MarketInterface = {
  async getPrices() {
    const tick = await getMarketTick();
    const seed = await getMarketSeed();
    const sectorIndexes = await getSectorIndexes();
    const prevPrices = await getPreviousPrices();

    const companies: CompanyWithPrice[] = COMPANIES.map((c) => {
      const currentPrice = calculateStockPrice(c, sectorIndexes, tick, seed);
      const prevPrice = prevPrices[c.id] ?? currentPrice;
      const change = currentPrice - prevPrice;
      const changePercent = prevPrice > 0 ? (change / prevPrice) * 100 : 0;
      return { ...c, currentPrice, change, changePercent };
    });

    const commodities: CommodityWithPrice[] = COMMODITIES.map((c) => {
      const sectorIndex = sectorIndexes[c.sectorId] ?? 100;
      const currentPrice = calculateCommodityPrice(
        c.basePrice, sectorIndex, c.volatilityMultiplier, tick, seed, c.id,
      );
      const prevPrice = prevPrices[c.id] ?? currentPrice;
      const change = currentPrice - prevPrice;
      const changePercent = prevPrice > 0 ? (change / prevPrice) * 100 : 0;
      return { ...c, currentPrice, change, changePercent };
    });

    const sectors: SectorWithState[] = await Promise.all(
      SECTORS.map(async (s) => ({
        ...s,
        status: await getSectorStatus(s.id),
        indexValue: sectorIndexes[s.id] ?? 100,
      })),
    );

    const globalValue = calculateGlobalIndex(sectorIndexes);
    const prevGlobal = prevPrices["__global"] ?? globalValue;
    const globalChange = globalValue - prevGlobal;
    const globalChangePercent = prevGlobal > 0 ? (globalChange / prevGlobal) * 100 : 0;

    return {
      companies,
      commodities,
      sectors,
      globalIndex: { value: globalValue, change: globalChange, changePercent: globalChangePercent },
    };
  },

  async getPriceHistory({ type, id, lastN = 50 }) {
    const key =
      type === "global"
        ? "market:history:global"
        : `market:history:${type}:${id}`;

    // zrange with scores returns [member, score, member, score, ...]
    const raw = await redis.zrange<string[]>(key, -lastN, -1, { withScores: true });
    if (!raw || raw.length === 0) return [];

    const result: Array<{ tick: number; price: number }> = [];
    for (let i = 0; i < raw.length; i += 2) {
      result.push({ price: Number(raw[i]), tick: Number(raw[i + 1]) });
    }
    return result;
  },

  async getCompany(companyId) {
    const company = COMPANIES.find((c) => c.id === companyId);
    if (!company) return null;
    const tick = await getMarketTick();
    const seed = await getMarketSeed();
    const sectorIndexes = await getSectorIndexes();
    const currentPrice = calculateStockPrice(company, sectorIndexes, tick, seed);
    return { ...company, currentPrice };
  },

  async updateSectorIndex(sectorId, newValue) {
    await setSectorIndex(sectorId, newValue);
  },

  async updateSectorStatus(sectorId, status) {
    await setSectorStatus(sectorId, status as SectorStatus);
  },

  async updateCompanyBaseValue(_companyId, _newBaseValue) {
    // For v1, base values are static in code. This will store overrides later.
  },

  async tick() {
    const tick = await redis.incr("market:tick");
    const seed = await getMarketSeed();

    // Initialize sectors on first tick
    if (tick === 1) {
      for (const sector of SECTORS) {
        const initial = INITIAL_SECTOR_STATE[sector.id] ?? { indexValue: 100, status: "stable" as SectorStatus };
        await setSectorIndex(sector.id, initial.indexValue);
        await setSectorStatus(sector.id, initial.status);
      }
    }

    // Update each sector's index based on its status
    for (const sector of SECTORS) {
      const status = await getSectorStatus(sector.id);
      const currentIndex = await getSectorIndex(sector.id);
      const newIndex = calcSectorIndex(
        currentIndex, status, sector.baseVolatility, tick, seed, sector.id,
      );
      await setSectorIndex(sector.id, newIndex);

      // Store sector history
      await redis.zadd(`market:history:sector:${sector.id}`, {
        score: tick,
        member: String(newIndex),
      });
      await redis.zremrangebyrank(`market:history:sector:${sector.id}`, 0, -(HISTORY_MAX + 1));
    }

    // Compute and store company prices
    const sectorIndexes = await getSectorIndexes();
    for (const company of COMPANIES) {
      const price = calculateStockPrice(company, sectorIndexes, tick, seed);
      await redis.zadd(`market:history:company:${company.id}`, {
        score: tick,
        member: String(price),
      });
      await redis.zremrangebyrank(`market:history:company:${company.id}`, 0, -(HISTORY_MAX + 1));
    }

    // Compute and store commodity prices
    for (const commodity of COMMODITIES) {
      const sectorIndex = sectorIndexes[commodity.sectorId] ?? 100;
      const price = calculateCommodityPrice(
        commodity.basePrice, sectorIndex, commodity.volatilityMultiplier,
        tick, seed, commodity.id,
      );
      await redis.zadd(`market:history:commodity:${commodity.id}`, {
        score: tick,
        member: String(price),
      });
      await redis.zremrangebyrank(`market:history:commodity:${commodity.id}`, 0, -(HISTORY_MAX + 1));
    }

    // Global index
    const globalIndex = calculateGlobalIndex(sectorIndexes);
    await redis.set("market:global_index", globalIndex);
    await redis.zadd("market:history:global", {
      score: tick,
      member: String(globalIndex),
    });
    await redis.zremrangebyrank("market:history:global", 0, -(HISTORY_MAX + 1));
  },
};
