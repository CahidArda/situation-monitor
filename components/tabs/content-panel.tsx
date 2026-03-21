"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDMStore } from "@/stores/dms";
import { NewsTab } from "@/components/news/news-tab";
import { DMsTab } from "@/components/dms/dms-tab";

export function ContentPanel() {
  const totalUnread = useDMStore((s) => s.getTotalUnread());

  return (
    <Tabs defaultValue="news" className="flex flex-col h-full">
      <div className="border-b border-border px-4">
        <TabsList className="bg-transparent h-auto p-0 gap-0">
          <TabsTrigger
            value="news"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-4 py-2.5 text-sm"
          >
            News
          </TabsTrigger>
          <TabsTrigger
            value="market"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-4 py-2.5 text-sm"
            disabled
          >
            Market
          </TabsTrigger>
          <TabsTrigger
            value="portfolio"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-4 py-2.5 text-sm"
            disabled
          >
            Portfolio
          </TabsTrigger>
          <TabsTrigger
            value="dms"
            className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-4 py-2.5 text-sm"
          >
            DMs
            {totalUnread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">
                {totalUnread}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="news" className="flex-1 flex flex-col mt-0 overflow-hidden">
        <NewsTab />
      </TabsContent>

      <TabsContent value="market" className="flex-1 flex items-center justify-center mt-0">
        <p className="text-muted-foreground text-sm">Market — coming soon</p>
      </TabsContent>

      <TabsContent value="portfolio" className="flex-1 flex items-center justify-center mt-0">
        <p className="text-muted-foreground text-sm">Portfolio — coming soon</p>
      </TabsContent>

      <TabsContent value="dms" className="flex-1 flex flex-col mt-0 overflow-hidden">
        <DMsTab />
      </TabsContent>
    </Tabs>
  );
}
