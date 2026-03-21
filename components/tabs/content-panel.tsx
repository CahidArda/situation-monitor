"use client";

import { useState } from "react";
import { useDMStore } from "@/stores/dms";
import { Navbar } from "@/components/layout/navbar";
import { NewsTab } from "@/components/news/news-tab";
import { DMsTab } from "@/components/dms/dms-tab";

export function ContentPanel() {
  const [activeTab, setActiveTab] = useState("news");
  const totalUnread = useDMStore((s) => s.getTotalUnread());

  return (
    <div className="flex flex-col h-full">
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        badge={totalUnread > 0 ? { dms: totalUnread } : undefined}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {activeTab === "news" && <NewsTab />}
        {activeTab === "market" && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground text-sm">Market — coming soon</p>
          </div>
        )}
        {activeTab === "portfolio" && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground text-sm">Portfolio — coming soon</p>
          </div>
        )}
        {activeTab === "dms" && <DMsTab />}
      </div>
    </div>
  );
}
