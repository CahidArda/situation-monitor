"use client";

import { useQuery } from "@tanstack/react-query";
import { TICK_POLL_MS } from "@/lib/constants";

async function tick(): Promise<{ status: string; nextIn?: number }> {
  const res = await fetch("/api/tick", { method: "POST" });
  return res.json();
}

export function useTick() {
  return useQuery({
    queryKey: ["tick"],
    queryFn: tick,
    refetchInterval: TICK_POLL_MS,
  });
}
