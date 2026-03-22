"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";

export function useActiveTab() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const activeTab = searchParams.get("tab") ?? "news";

  const setActiveTab = useCallback(
    (tab: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      if (tab !== "dms") params.delete("dm");
      if (tab !== "news") params.delete("news");
      if (tab !== "market") { params.delete("ticker"); params.delete("sector"); }
      router.push(`${pathname}?${params}`);
    },
    [searchParams, router, pathname],
  );

  return { activeTab, setActiveTab };
}

export function useNavigateToDM() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return useCallback(
    (personaId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", "dms");
      params.set("dm", personaId);
      params.delete("news");
      params.delete("ticker");
      params.delete("sector");
      router.push(`${pathname}?${params}`);
    },
    [searchParams, router, pathname],
  );
}

export function useNavigateToMarket() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return useCallback(
    (opts?: { ticker?: string; sector?: string }) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", "market");
      params.delete("dm");
      params.delete("news");
      if (opts?.ticker) params.set("ticker", opts.ticker);
      else params.delete("ticker");
      if (opts?.sector) params.set("sector", opts.sector);
      else params.delete("sector");
      router.push(`${pathname}?${params}`);
    },
    [searchParams, router, pathname],
  );
}

export function useNavigateToNews() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return useCallback(
    (newsId: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", "news");
      if (newsId) {
        params.set("news", newsId);
      } else {
        params.delete("news");
      }
      params.delete("dm");
      params.delete("ticker");
      params.delete("sector");
      router.push(`${pathname}?${params}`);
    },
    [searchParams, router, pathname],
  );
}
