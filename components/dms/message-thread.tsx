"use client";

import { useEffect, useRef } from "react";
import { Loader2, ArrowLeft } from "lucide-react";
import { useDMMessages } from "@/hooks/use-dms";
import { useDMStore } from "@/stores/dms";
import { UserPopover } from "@/components/user-popover";
import { HoverableContent } from "@/components/hoverable-content";
import type { DirectMessage } from "@/lib/interfaces/types";

const EMPTY_MESSAGES: DirectMessage[] = [];

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function MessageBubble({ message }: { message: DirectMessage }) {
  return (
    <div className="px-4 py-1.5">
      <div className="inline-block max-w-[85%] rounded-lg bg-blue-50 border border-blue-100 px-3 py-2">
        <p className="text-sm text-foreground whitespace-pre-wrap">
          <HoverableContent content={message.content} entities={message.entities} />
        </p>
        <span className="text-xs text-muted-foreground mt-1 block">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
}

export function MessageThread({
  personaId,
  onBack,
}: {
  personaId: string;
  onBack: () => void;
}) {
  const { data, isLoading } = useDMMessages(personaId);
  const setMessages = useDMStore((s) => s.setMessages);
  const markRead = useDMStore((s) => s.markRead);
  const messages = useDMStore((s) => s.messages[personaId]) ?? EMPTY_MESSAGES;
  const conversations = useDMStore((s) => s.conversations);
  const convo = conversations.find((c) => c.personaId === personaId);

  useEffect(() => {
    if (data?.messages) {
      setMessages(personaId, [...data.messages].reverse());
    }
  }, [data, personaId, setMessages]);

  useEffect(() => {
    markRead(personaId);
  }, [personaId, markRead]);

  // Scroll to bottom when messages load
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current && messages.length > 0) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <UserPopover personaId={personaId} displayName={convo?.personaDisplayName ?? personaId}>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-foreground text-sm">
              {convo?.personaDisplayName ?? personaId}
            </span>
            <span className="text-xs text-muted-foreground">
              {convo?.personaHandle}
            </span>
          </div>
        </UserPopover>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto flex flex-col py-2">
        {isLoading && messages.length === 0 ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center text-muted-foreground text-sm p-8">
            No messages yet.
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))
        )}
      </div>
    </div>
  );
}
