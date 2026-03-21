import type { Sector } from "@/lib/interfaces/types";

export const SECTORS: Sector[] = [
  {
    id: "energy",
    name: "Energy",
    description: "Oil, gas, renewables",
    baseVolatility: 0.6,
  },
  {
    id: "tech",
    name: "Technology",
    description: "Software, hardware, AI",
    baseVolatility: 0.7,
  },
  {
    id: "agriculture",
    name: "Agriculture",
    description: "Farming, food processing, fishing",
    baseVolatility: 0.4,
  },
  {
    id: "defense",
    name: "Defense",
    description: "Military, security, aerospace",
    baseVolatility: 0.3,
  },
  {
    id: "finance",
    name: "Finance",
    description: "Banks, insurance, fintech",
    baseVolatility: 0.5,
  },
  {
    id: "luxury",
    name: "Luxury",
    description: "Fashion, yachts, exotic goods",
    baseVolatility: 0.5,
  },
  {
    id: "mining",
    name: "Mining",
    description: "Gold, silver, rare earth metals",
    baseVolatility: 0.6,
  },
  {
    id: "shipping",
    name: "Shipping",
    description: "Maritime, logistics, cargo",
    baseVolatility: 0.4,
  },
  {
    id: "entertainment",
    name: "Entertainment",
    description: "Media, gaming, tourism",
    baseVolatility: 0.5,
  },
];

export function getSector(id: string): Sector | undefined {
  return SECTORS.find((s) => s.id === id);
}
