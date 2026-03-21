import type { Commodity } from "@/lib/interfaces/types";

export const COMMODITIES: Commodity[] = [
  {
    id: "oil",
    name: "Crude Oil",
    ticker: "OIL",
    unit: "barrel",
    sectorId: "energy",
    basePrice: 75,
    volatilityMultiplier: 1.5,
  },
  {
    id: "gold",
    name: "Gold",
    ticker: "GOLD",
    unit: "oz",
    sectorId: "mining",
    basePrice: 1950,
    volatilityMultiplier: 0.5,
  },
  {
    id: "silver",
    name: "Silver",
    ticker: "SLVR",
    unit: "oz",
    sectorId: "mining",
    basePrice: 24,
    volatilityMultiplier: 0.7,
  },
  {
    id: "fish-futures",
    name: "Fish Futures",
    ticker: "FISH",
    unit: "ton",
    sectorId: "agriculture",
    basePrice: 320,
    volatilityMultiplier: 1.8,
  },
  {
    id: "rare-earth",
    name: "Rare Earth Index",
    ticker: "REIX",
    unit: "kg",
    sectorId: "mining",
    basePrice: 450,
    volatilityMultiplier: 1.3,
  },
];

export function getCommodity(id: string): Commodity | undefined {
  return COMMODITIES.find((c) => c.id === id);
}

export function getCommoditiesBySector(sectorId: string): Commodity[] {
  return COMMODITIES.filter((c) => c.sectorId === sectorId);
}
