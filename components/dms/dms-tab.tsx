"use client";

import { useEffect, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { playNotificationSound } from "@/lib/sounds";
import { useDMConversations } from "@/hooks/use-dms";
import { useDMStore } from "@/stores/dms";
import { ConversationList } from "./conversation-list";
import { MessageThread } from "./message-thread";

export function DMsTab() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const { data, isLoading } = useDMConversations();
  const conversations = useDMStore((s) => s.conversations);
  const setConversations = useDMStore((s) => s.setConversations);

  // Read active DM persona from URL
  const activePersona = searchParams.get("dm");

  const setActivePersona = (personaId: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (personaId) {
      params.set("dm", personaId);
    } else {
      params.delete("dm");
    }
    router.push(`${pathname}?${params}`);
  };

  const prevConvoCount = useRef(0);
  useEffect(() => {
    if (data?.conversations) {
      if (data.conversations.length > prevConvoCount.current && prevConvoCount.current > 0) {
        playNotificationSound();
      }
      prevConvoCount.current = data.conversations.length;
      setConversations(data.conversations);
    }
  }, [data, setConversations]);

  if (activePersona) {
    return (
      <MessageThread
        personaId={activePersona}
        onBack={() => setActivePersona(null)}
      />
    );
  }

  if (isLoading && conversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <ConversationList
      conversations={conversations}
      onSelect={(personaId) => setActivePersona(personaId)}
    />
  );
}
