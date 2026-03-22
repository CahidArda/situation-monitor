"use client";

import { useQuery } from "@tanstack/react-query";
import { DM_POLL_MS } from "@/lib/constants";
import type { DMConversation, DirectMessage } from "@/lib/interfaces/types";

// Session start time — DMs before this are not shown
const SESSION_START = Date.now();

async function fetchConversations(): Promise<{
  conversations: DMConversation[];
}> {
  const res = await fetch(`/api/dms?afterTs=${SESSION_START}`);
  return res.json();
}

async function fetchMessages(
  personaId: string,
  params?: { limit?: number; beforeTs?: number },
): Promise<{ messages: DirectMessage[]; hasMore: boolean }> {
  const sp = new URLSearchParams();
  sp.set("afterTs", String(SESSION_START));
  if (params?.limit) sp.set("limit", String(params.limit));
  if (params?.beforeTs) sp.set("beforeTs", String(params.beforeTs));
  const res = await fetch(`/api/dms/${personaId}?${sp}`);
  return res.json();
}

export function useDMConversations() {
  return useQuery({
    queryKey: ["dms", "conversations"],
    queryFn: () => fetchConversations(),
    refetchInterval: DM_POLL_MS,
  });
}

export function useDMMessages(personaId: string | null) {
  return useQuery({
    queryKey: ["dms", "messages", personaId],
    queryFn: () => fetchMessages(personaId!),
    enabled: !!personaId,
  });
}
