"use client";

import { Mail, MessageSquare } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useFeedStore } from "@/stores/feed";
import { useNavigateToDM } from "@/hooks/use-tab";

export function UserPopover({
  personaId,
  displayName,
  children,
}: {
  personaId: string;
  displayName: string;
  children: React.ReactNode;
}) {
  const setFeedFilter = useFeedStore((s) => s.setFilter);
  const navigateToDM = useNavigateToDM();

  return (
    <Popover>
      <PopoverTrigger openOnHover delay={300} closeDelay={200} className="hover:underline cursor-pointer text-left">
        {children}
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-1 flex flex-col gap-0.5"
        side="top"
        align="start"
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigateToDM(personaId);
          }}
          className="flex items-center gap-2 px-3 py-1.5 text-sm rounded hover:bg-accent transition-colors text-left"
        >
          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
          See DMs
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setFeedFilter({ authorId: personaId, label: displayName });
          }}
          className="flex items-center gap-2 px-3 py-1.5 text-sm rounded hover:bg-accent transition-colors text-left"
        >
          <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
          Filter feed by user
        </button>
      </PopoverContent>
    </Popover>
  );
}
