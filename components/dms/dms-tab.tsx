"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useDMStore } from "@/stores/dms";
import { ConversationList } from "./conversation-list";
import { MessageThread } from "./message-thread";

export function DMsTab() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Conversations are polled globally in MainLayout — just read from the store
  const conversations = useDMStore((s) => s.conversations);

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

  if (activePersona) {
    return (
      <MessageThread
        personaId={activePersona}
        onBack={() => setActivePersona(null)}
      />
    );
  }

  if (conversations.length === 0) {
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
