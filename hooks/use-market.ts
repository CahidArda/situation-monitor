"use client";

import { useQuery } from "@tanstack/react-query";
import type { CompanyWithPrice, CommodityWithPrice, SectorWithState } from "@/lib/interfaces/market";

type MarketData = {
  companies: CompanyWithPrice[];
  commodities: CommodityWithPrice[];
  sectors: SectorWithState[];
  globalIndex: { value: number; change: number; changePercent: number };
};

type HistoryPoint = { tick: number; price: number };

async function fetchMarketPrices(): Promise<MarketData> {
  const res = await fetch("/api/market");
  return res.json();
}

async function fetchPriceHistory(
  type: string,
  id: string,
  lastN?: number,
): Promise<HistoryPoint[]> {
  const sp = new URLSearchParams({ type, id });
  if (lastN) sp.set("lastN", String(lastN));
  const res = await fetch(`/api/market/history?${sp}`);
  return res.json();
}

type HistoryQuery = { type: string; id: string };

async function fetchBatchHistory(
  queries: HistoryQuery[],
  lastN = 50,
): Promise<Record<string, HistoryPoint[]>> {
  const q = queries.map((q) => `${q.type}:${q.id}`).join(",");
  const sp = new URLSearchParams({ q, lastN: String(lastN) });
  const res = await fetch(`/api/market/history?${sp}`);
  return res.json();
}

export function useMarketPrices() {
  return useQuery({
    queryKey: ["market", "prices"],
    queryFn: fetchMarketPrices,
    refetchInterval: 4_000,
  });
}

export function usePriceHistory(type: string, id: string, lastN = 50) {
  return useQuery({
    queryKey: ["market", "history", type, id],
    queryFn: () => fetchPriceHistory(type, id, lastN),
    refetchInterval: 10_000,
    enabled: !!id,
  });
}

export function useBatchPriceHistory(queries: HistoryQuery[], lastN = 30) {
  const key = queries.map((q) => `${q.type}:${q.id}`).join(",");
  return useQuery({
    queryKey: ["market", "history", "batch", key],
    queryFn: () => fetchBatchHistory(queries, lastN),
    refetchInterval: 10_000,
    enabled: queries.length > 0,
  });
}
