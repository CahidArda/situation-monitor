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
      router.replace(`${pathname}?${params}`);
    },
    [searchParams, router, pathname],
  );

  return { activeTab, setActiveTab };
}

/**
 * Navigate to the DMs tab and open a specific conversation.
 * Call from any component without prop drilling.
 */
export function useNavigateToDM() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return useCallback(
    (personaId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", "dms");
      params.set("dm", personaId);
      router.replace(`${pathname}?${params}`);
    },
    [searchParams, router, pathname],
  );
}
