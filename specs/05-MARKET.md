# 05 — Stock Market Spec

## Overview

The simulated stock market has companies grouped into sectors. Sector indexes drive company prices (reverse of real life). A global index aggregates sectors. Prices include brownian motion noise for realism.

## Core Concepts

### Sectors

```typescript
interface Sector {
  id: string;
  name: string;
  description: string;
  status: "bull" | "bear" | "volatile" | "stable";
  indexValue: number;         // current sector index (starts at 100)
  baseVolatility: number;     // 0.0–1.0, base noise level
  momentum: number;           // -1.0 to 1.0, trend direction
  lastUpdated: number;        // timestamp
}
```

Sector examples:
- `energy` — Oil, gas, renewables
- `tech` — Software, hardware, AI
- `agriculture` — Farming, food processing, fishing
- `defense` — Military, security, aerospace
- `finance` — Banks, insurance, fintech
- `luxury` — Fashion, yachts, exotic goods
- `mining` — Gold, silver, rare earth metals
- `shipping` — Maritime, logistics, cargo
- `entertainment` — Media, gaming, tourism

### Companies

```typescript
interface Company {
  id: string;
  name: string;
  ticker: string;           // 3-4 letter symbol
  description: string;
  ceoName: string;
  headquarters: { city: string; country: string };
  sectors: Array<{
    sectorId: string;
    weight: number;          // how much this sector affects the company (0.0–1.0)
  }>;
  baseValue: number;         // company intrinsic value (starts at some number)
  volatilityMultiplier: number; // company-specific volatility factor
  founded: string;           // year
  employees: number;
  funFact: string;           // for comedic flavor
}
```

Company examples:
```typescript
const COMPANIES: Company[] = [
  {
    id: "meridian-fish",
    name: "Meridian Fisheries International",
    ticker: "MRDN",
    description: "Global leader in premium sustainable fishing and aquaculture",
    ceoName: "Björn Halvorsen",
    headquarters: { city: "Bergen", country: "Norway" },
    sectors: [
      { sectorId: "agriculture", weight: 0.7 },
      { sectorId: "shipping", weight: 0.3 },
    ],
    baseValue: 45,
    volatilityMultiplier: 1.2,
    founded: "1987",
    employees: 12000,
    funFact: "Their CEO once arm-wrestled a tuna and won",
  },
  {
    id: "aurum-dynamics",
    name: "Aurum Dynamics",
    ticker: "AURM",
    description: "Vertically integrated gold mining and refining",
    ceoName: "Margaret Okonkwo",
    headquarters: { city: "Johannesburg", country: "South Africa" },
    sectors: [
      { sectorId: "mining", weight: 0.9 },
      { sectorId: "finance", weight: 0.1 },
    ],
    baseValue: 120,
    volatilityMultiplier: 0.8,
    founded: "1952",
    employees: 35000,
    funFact: "Company mascot is a golden retriever named 'Bullion'",
  },
  // ... 15-25 companies total, across all sectors
];
```

### Commodities

In addition to company stocks, the market has commodity prices (oil, gold, silver) that track sector indexes directly:

```typescript
interface Commodity {
  id: string;
  name: string;
  ticker: string;
  unit: string;               // "barrel", "oz", "oz"
  sectorId: string;           // which sector it tracks
  basePrice: number;
  volatilityMultiplier: number;
}

const COMMODITIES: Commodity[] = [
  { id: "oil", name: "Crude Oil", ticker: "OIL", unit: "barrel", sectorId: "energy", basePrice: 75, volatilityMultiplier: 1.5 },
  { id: "gold", name: "Gold", ticker: "GOLD", unit: "oz", sectorId: "mining", basePrice: 1950, volatilityMultiplier: 0.5 },
  { id: "silver", name: "Silver", ticker: "SLVR", unit: "oz", sectorId: "mining", basePrice: 24, volatilityMultiplier: 0.7 },
  { id: "fish-futures", name: "Fish Futures", ticker: "FISH", unit: "ton", sectorId: "agriculture", basePrice: 320, volatilityMultiplier: 1.8 },
  { id: "rare-earth", name: "Rare Earth Index", ticker: "RARE", unit: "kg", sectorId: "mining", basePrice: 450, volatilityMultiplier: 1.3 },
];
```

## Price Calculation

### Company Stock Price at Time t

```typescript
function calculateStockPrice(
  company: Company,
  sectors: Record<string, Sector>,
  tick: number,
  seed: number
): number {
  // 1. Start with company base value
  let price = company.baseValue;

  // 2. Apply sector influence
  for (const { sectorId, weight } of company.sectors) {
    const sector = sectors[sectorId];
    // Sector index is normalized: 100 = neutral
    // If sector index is 120, it means +20% influence
    const sectorInfluence = (sector.indexValue - 100) / 100;
    price *= (1 + sectorInfluence * weight);
  }

  // 3. Apply brownian motion noise
  const noise = brownianMotion(tick, seed, company.volatilityMultiplier);
  price *= (1 + noise);

  // 4. Clamp to minimum
  return Math.max(price, 0.01);
}
```

### Brownian Motion

Geometric brownian motion with seeded PRNG:

```typescript
function brownianMotion(
  tick: number,
  seed: number,
  volatilityMultiplier: number
): number {
  // Use seeded PRNG for reproducibility
  const rng = seededRandom(seed + tick);

  // Parameters
  const dt = 1;                        // time step
  const sigma = 0.02 * volatilityMultiplier; // volatility
  const mu = 0;                         // drift (0 = no inherent direction)

  // Wiener process increment
  const dW = Math.sqrt(dt) * gaussianRandom(rng);

  // GBM increment
  return mu * dt + sigma * dW;
}

// Seeded PRNG (e.g., mulberry32)
function seededRandom(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s |= 0; s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Box-Muller transform for Gaussian random
function gaussianRandom(rng: () => number): number {
  const u1 = rng();
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}
```

### Sector Index Updates

When the seed event fires periodically, it updates sector indexes based on their status:

```typescript
function updateSectorIndex(sector: Sector): number {
  const { status, indexValue, baseVolatility, momentum } = sector;

  const statusMultipliers = {
    bull:     { drift: 0.005,  vol: 0.8 },
    bear:     { drift: -0.005, vol: 0.8 },
    volatile: { drift: 0,      vol: 2.0 },
    stable:   { drift: 0.001,  vol: 0.3 },
  };

  const { drift, vol } = statusMultipliers[status];
  const change = drift + momentum * 0.002 + (Math.random() - 0.5) * baseVolatility * vol * 0.01;
  return indexValue * (1 + change);
}
```

### Global Index

The global index is a weighted average of all sector indexes:

```typescript
function calculateGlobalIndex(sectors: Record<string, Sector>): number {
  const sectorList = Object.values(sectors);
  const totalWeight = sectorList.length; // equal weight for simplicity
  const sum = sectorList.reduce((acc, s) => acc + s.indexValue, 0);
  return sum / totalWeight;
}
```

## Redis Schema

```
market:sector:{sectorId}           → JSON of Sector
market:company:{companyId}         → JSON of Company
market:commodity:{commodityId}     → JSON of Commodity
market:global_index                → number
market:tick                        → number (current tick, incremented on each update)
market:seed                        → number (master seed for brownian motion)

# Price history (for sparklines)
market:history:company:{companyId}   → Sorted Set (score = tick, member = price)
market:history:sector:{sectorId}     → Sorted Set (score = tick, member = indexValue)
market:history:commodity:{commodityId} → Sorted Set (score = tick, member = price)
market:history:global                → Sorted Set (score = tick, member = indexValue)
```

Trim price history to last 200 ticks to avoid unbounded growth.

## Backend Interface

```typescript
// lib/interfaces/market.ts

interface MarketInterface {
  // Get all current prices (for the market overview)
  getPrices(): Promise<{
    companies: Array<Company & { currentPrice: number; change: number; changePercent: number }>;
    commodities: Array<Commodity & { currentPrice: number; change: number; changePercent: number }>;
    sectors: Sector[];
    globalIndex: { value: number; change: number; changePercent: number };
  }>;

  // Get price history for sparklines
  getPriceHistory(params: {
    type: "company" | "sector" | "commodity" | "global";
    id: string;
    lastN?: number;   // default 50
  }): Promise<Array<{ tick: number; price: number }>>;

  // Get single company details
  getCompany(companyId: string): Promise<(Company & { currentPrice: number }) | null>;

  // --- Write methods (for event handlers) ---

  // Update sector index value
  updateSectorIndex(sectorId: string, newValue: number): Promise<void>;

  // Update sector status
  updateSectorStatus(sectorId: string, status: Sector["status"]): Promise<void>;

  // Update company base value
  updateCompanyBaseValue(companyId: string, newBaseValue: number): Promise<void>;

  // Tick: advance the simulation clock, recalculate all prices, store history
  tick(): Promise<void>;
}
```

## API Routes

### `GET /api/market`
Returns: full price overview (all companies, commodities, sectors, global index)

### `GET /api/market/history`
Query params: `type`, `id`, `lastN`
Returns: price history array

### `GET /api/market/company/[id]`
Returns: company detail with current price

## Frontend Behavior

1. Market tab shows:
   - Global index at top with sparkline
   - Sector indexes as a row of cards with mini sparklines
   - Company list as a table: ticker, name, price, change, change%, mini sparkline
   - Commodities as a separate row: oil, gold, silver, fish futures
2. Poll for prices every 3-5 seconds
3. Color coding: green for up, red for down
4. Click a company → expanded view with larger chart, details, buy/sell buttons
5. Sector filter: click a sector to filter companies
