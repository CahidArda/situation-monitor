"use client";

import { Newspaper, MessageSquare } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { parseEntities } from "@/lib/entities";
import { useFeedStore } from "@/stores/feed";
import { useNewsStore } from "@/stores/news";
import type { ContentEntity } from "@/lib/interfaces/types";

function EntityPopover({
  text,
  entity,
}: {
  text: string;
  entity: ContentEntity;
}) {
  const setFeedFilter = useFeedStore((s) => s.setFilter);
  const setNewsFilter = useNewsStore((s) => s.setFilter);

  return (
    <Popover>
      <PopoverTrigger openOnHover delay={300} closeDelay={200} className="underline decoration-dotted underline-offset-2 decoration-muted-foreground/50 hover:decoration-foreground transition-colors cursor-pointer">
        {text}
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-1 flex flex-col gap-0.5"
        side="top"
        align="start"
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setFeedFilter({ search: entity.text, label: entity.text });
          }}
          className="flex items-center gap-2 px-3 py-1.5 text-sm rounded hover:bg-accent transition-colors text-left"
        >
          <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
          Search feed
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setNewsFilter({ search: entity.text, label: entity.text });
          }}
          className="flex items-center gap-2 px-3 py-1.5 text-sm rounded hover:bg-accent transition-colors text-left"
        >
          <Newspaper className="h-3.5 w-3.5 text-muted-foreground" />
          Search news
        </button>
      </PopoverContent>
    </Popover>
  );
}

export function HoverableContent({
  content,
  entities,
}: {
  content: string;
  entities?: ContentEntity[];
}) {
  const segments = parseEntities(content, entities);

  return (
    <>
      {segments.map((seg, i) =>
        seg.kind === "text" ? (
          <span key={i}>{seg.text}</span>
        ) : (
          <EntityPopover key={i} text={seg.text} entity={seg.entity} />
        ),
      )}
    </>
  );
}
