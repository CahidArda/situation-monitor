"use client";

import { Newspaper, MessageSquare, TrendingUp } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { parseEntities } from "@/lib/entities";
import { useFeedStore } from "@/stores/feed";
import { useNewsStore } from "@/stores/news";
import { useNavigateToMarket } from "@/hooks/use-tab";
import { useActiveTab } from "@/hooks/use-tab";
import { COMPANIES } from "@/lib/market/companies";
import { SECTORS } from "@/lib/market/sectors";
import type { ContentEntity } from "@/lib/interfaces/types";

function getMarketAction(entity: ContentEntity) {
  if (entity.type === "ticker") {
    const company = COMPANIES.find((c) => c.ticker === entity.text);
    if (company) return { label: "View in Market", opts: { ticker: entity.text } };
  }
  if (entity.type === "company") {
    const company = COMPANIES.find((c) => c.name === entity.text);
    if (company) return { label: "View in Market", opts: { ticker: company.ticker } };
  }
  if (entity.type === "sector") {
    const sector = SECTORS.find((s) => s.name === entity.text);
    if (sector) return { label: `View ${sector.name} sector`, opts: { sector: sector.id } };
  }
  return null;
}

function EntityPopover({
  text,
  entity,
}: {
  text: string;
  entity: ContentEntity;
}) {
  const setFeedFilter = useFeedStore((s) => s.setFilter);
  const setNewsFilter = useNewsStore((s) => s.setFilter);
  const navigateToMarket = useNavigateToMarket();
  const { setActiveTab } = useActiveTab();

  const marketAction = getMarketAction(entity);

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
            setActiveTab("news");
          }}
          className="flex items-center gap-2 px-3 py-1.5 text-sm rounded hover:bg-accent transition-colors text-left"
        >
          <Newspaper className="h-3.5 w-3.5 text-muted-foreground" />
          Search news
        </button>
        {marketAction && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigateToMarket(marketAction.opts);
            }}
            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded hover:bg-accent transition-colors text-left"
          >
            <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
            {marketAction.label}
          </button>
        )}
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
