"use client";

import type { DMConversation } from "@/lib/interfaces/types";
import { useDMStore } from "@/stores/dms";
import { UserPopover } from "@/components/user-popover";

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function ConversationList({
  conversations,
  onSelect,
}: {
  conversations: DMConversation[];
  onSelect: (personaId: string) => void;
}) {
  const readTimestamps = useDMStore((s) => s.readTimestamps);

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm p-8">
        No messages yet. Your insiders are silent.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.map((convo) => {
        const lastRead = readTimestamps[convo.personaId] ?? 0;
        const hasUnread = convo.lastTimestamp > lastRead;

        return (
          <div
            key={convo.personaId}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(convo.personaId)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onSelect(convo.personaId); }}
            className="w-full text-left px-4 py-3 border-b border-border hover:bg-accent/30 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between mb-0.5">
              <UserPopover personaId={convo.personaId} displayName={convo.personaDisplayName}>
                <span className="flex items-center gap-1.5 min-w-0">
                  <span className="font-semibold text-foreground truncate">
                    {convo.personaDisplayName}
                  </span>
                  <span className="text-sm text-muted-foreground truncate">
                    {convo.personaHandle}
                  </span>
                </span>
              </UserPopover>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                {hasUnread && (
                  <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                )}
                <span className="text-xs text-muted-foreground">
                  {timeAgo(convo.lastTimestamp)}
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {convo.lastMessage}
            </p>
          </div>
        );
      })}
    </div>
  );
}
