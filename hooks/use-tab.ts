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
      // Clear DM param when switching away from DMs
      if (tab !== "dms") params.delete("dm");
      // Clear news param when switching away from news
      if (tab !== "news") params.delete("news");
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
      router.push(`${pathname}?${params}`);
    },
    [searchParams, router, pathname],
  );
}
