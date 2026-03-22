"use client";

import { useCallback, useEffect, useRef } from "react";
import { Mail, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDMStore } from "@/stores/dms";
import { useDMMessages } from "@/hooks/use-dms";
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

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

/** Popover showing messages for an open conversation */
function ConversationPopover({ personaId }: { personaId: string }) {
  const conversations = useDMStore((s) => s.conversations);
  const convo = conversations.find((c) => c.personaId === personaId);
  const closeConversation = useDMStore((s) => s.closeConversation);
  const markRead = useDMStore((s) => s.markRead);
  const setMessages = useDMStore((s) => s.setMessages);
  const messages = useDMStore((s) => s.messages[personaId]) ?? EMPTY_MESSAGES;
  const unread = useDMStore((s) => s.getUnreadCount(personaId));

  const { data } = useDMMessages(personaId);
  useEffect(() => {
    if (data?.messages) {
      setMessages(personaId, [...data.messages].reverse());
    }
  }, [data, personaId, setMessages]);

  const scrollNodeRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    if (scrollNodeRef.current) {
      scrollNodeRef.current.scrollTop = scrollNodeRef.current.scrollHeight;
    }
  };
  // Scroll on mount (callback ref) and when messages update
  const setScrollRef = useCallback((node: HTMLDivElement | null) => {
    scrollNodeRef.current = node;
    if (node) node.scrollTop = node.scrollHeight;
  }, []);
  useEffect(() => { scrollToBottom(); }, [messages]);

  const displayName = convo?.personaDisplayName ?? personaId;

  return (
    <Popover>
      <PopoverTrigger
        openOnHover
        delay={200}
        closeDelay={300}
        className="flex items-center gap-2 px-4 py-2 text-sm rounded-t-md bg-card border border-b-0 border-border hover:bg-accent/50 transition-colors cursor-pointer relative"
        onClick={() => markRead(personaId)}
      >
        <span className="font-medium text-foreground truncate max-w-40">
          {displayName}
        </span>
        {unread > 0 && (
          <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            closeConversation(personaId);
          }}
          className="text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <X className="h-3 w-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        sideOffset={0}
        className="w-96 p-0 flex flex-col max-h-128"
      >
        <div className="border-b border-border px-3 py-2 flex items-center gap-2">
          <UserPopover personaId={personaId} displayName={displayName}>
            <span className="font-semibold text-sm">{displayName}</span>
            {convo && (
              <span className="text-xs text-muted-foreground ml-1">{convo.personaHandle}</span>
            )}
          </UserPopover>
        </div>
        <div ref={setScrollRef} className="flex-1 overflow-y-auto py-2">
          {messages.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-6">No messages</div>
          ) : (
            messages.slice(-5).map((msg) => (
              <div key={msg.id} className="px-3 py-1.5">
                <div className="inline-block max-w-[90%] rounded-lg bg-blue-50 border border-blue-100 px-3 py-2">
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    <HoverableContent content={msg.content} entities={msg.entities} />
                  </p>
                  <span className="text-xs text-muted-foreground mt-1 block">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Popover showing all DM conversations */
function DMListPopover() {
  const conversations = useDMStore((s) => s.conversations);
  const totalUnread = useDMStore((s) => s.getTotalUnread());
  const openConversation = useDMStore((s) => s.openConversation);
  const readTimestamps = useDMStore((s) => s.readTimestamps);

  return (
    <Popover>
      <PopoverTrigger
        openOnHover
        delay={200}
        closeDelay={300}
        className="flex items-center gap-2 px-4 py-2 text-sm rounded-t-md bg-card border border-b-0 border-border hover:bg-accent/50 transition-colors cursor-pointer relative"
      >
        <Mail className="h-3.5 w-3.5" />
        <span className="font-medium">DMs</span>
        {totalUnread > 0 && (
          <span className="h-4 min-w-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
            {totalUnread}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        sideOffset={0}
        className="w-96 p-0 max-h-128 overflow-y-auto"
      >
        {conversations.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-6">
            No conversations yet
          </div>
        ) : (
          conversations.map((convo) => {
            const lastRead = readTimestamps[convo.personaId] ?? 0;
            const hasUnread = convo.lastTimestamp > lastRead;
            return (
              <button
                key={convo.personaId}
                onClick={(e) => {
                  e.stopPropagation();
                  openConversation(convo.personaId);
                }}
                className="w-full text-left px-4 py-3 border-b border-border hover:bg-accent/30 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <UserPopover personaId={convo.personaId} displayName={convo.personaDisplayName}>
                    <span className="font-semibold text-sm text-foreground">
                      {convo.personaDisplayName}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      {convo.personaHandle}
                    </span>
                  </UserPopover>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {hasUnread && <span className="h-2 w-2 rounded-full bg-red-500" />}
                    <span className="text-xs text-muted-foreground">
                      {timeAgo(convo.lastTimestamp)}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground truncate mt-1">
                  {convo.lastMessage}
                </p>
              </button>
            );
          })
        )}
      </PopoverContent>
    </Popover>
  );
}

/** Bottom bar with DM conversations */
export function DMBar() {
  const openConversations = useDMStore((s) => s.openConversations);

  return (
    <div className="fixed bottom-0 left-[10%] flex items-end gap-1 z-50">
      <DMListPopover />
      {openConversations.map((personaId) => (
        <ConversationPopover key={personaId} personaId={personaId} />
      ))}
    </div>
  );
}
