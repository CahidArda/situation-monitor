"use client";

import { useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useDMStore } from "@/stores/dms";
import { Header } from "./header";
import { TabBar } from "./tab-bar";
import { ContentPanel } from "@/components/tabs/content-panel";
import { FeedPanel } from "@/components/feed/feed-panel";

export function MainLayout() {
  const [activeTab, setActiveTab] = useState("news");
  const totalUnread = useDMStore((s) => s.getTotalUnread());

  return (
    <div className="flex flex-col h-dvh">
      <Header />
      <div className="flex-1 w-[80%] mx-auto min-h-0">
        <ResizablePanelGroup
          id="main-layout"
          orientation="horizontal"
          className="h-full"
        >
          <ResizablePanel id="content" defaultSize="60%" minSize="30%">
            <div className="flex flex-col h-full">
              <TabBar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                badge={totalUnread > 0 ? { dms: totalUnread } : undefined}
              />
              <ContentPanel activeTab={activeTab} />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel id="feed" defaultSize="40%" minSize={300} maxSize="55%">
            <div className="flex flex-col h-full border-l border-border">
              <div className="border-b border-border px-4 h-10 flex items-center shrink-0">
                <h2 className="font-mono text-sm font-semibold tracking-wide text-muted-foreground">
                  FEED
                </h2>
              </div>
              <FeedPanel />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
