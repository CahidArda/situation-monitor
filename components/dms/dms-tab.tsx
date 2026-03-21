"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useDMConversations } from "@/hooks/use-dms";
import { useDMStore } from "@/stores/dms";
import { ConversationList } from "./conversation-list";
import { MessageThread } from "./message-thread";

export function DMsTab() {
  const { data, isLoading } = useDMConversations();
  const conversations = useDMStore((s) => s.conversations);
  const setConversations = useDMStore((s) => s.setConversations);
  const activeConversation = useDMStore((s) => s.activeConversation);
  const setActiveConversation = useDMStore((s) => s.setActiveConversation);

  useEffect(() => {
    if (data?.conversations) {
      setConversations(data.conversations);
    }
  }, [data, setConversations]);

  if (activeConversation) {
    return (
      <MessageThread
        personaId={activeConversation}
        onBack={() => setActiveConversation(null)}
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
      onSelect={(personaId) => setActiveConversation(personaId)}
    />
  );
}
