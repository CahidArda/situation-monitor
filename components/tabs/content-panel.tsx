"use client";

import { NewsTab } from "@/components/news/news-tab";
import { MarketTab } from "@/components/market/market-tab";

export function ContentPanel({ activeTab }: { activeTab: string }) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {activeTab === "news" && <NewsTab />}
      {activeTab === "market" && <MarketTab />}
      {activeTab === "portfolio" && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground text-sm">Portfolio — coming soon</p>
        </div>
      )}
    </div>
  );
}
