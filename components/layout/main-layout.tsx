"use client";

import { Suspense, useEffect, useRef } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Header } from "./header";
import { TabBar } from "./tab-bar";
import { ContentPanel } from "@/components/tabs/content-panel";
import { FeedPanel } from "@/components/feed/feed-panel";
import { useActiveTab } from "@/hooks/use-tab";
import { useTick } from "@/hooks/use-tick";
import { useDMConversations } from "@/hooks/use-dms";
import { useMarketPrices } from "@/hooks/use-market";
import { useDMStore } from "@/stores/dms";
import { useMarketStore } from "@/stores/market";
import { playNotificationSound } from "@/lib/sounds";

function MainLayoutInner() {
  const { activeTab, setActiveTab } = useActiveTab();
  const totalUnread = useDMStore((s) => s.getTotalUnread());
  const setConversations = useDMStore((s) => s.setConversations);
  const setPrices = useMarketStore((s) => s.setPrices);

  // Poll the tick endpoint every 10s to keep the simulation alive
  useTick();

  // Poll market prices globally so ticker tape works on any tab
  const { data: marketData } = useMarketPrices();
  useEffect(() => {
    if (marketData) setPrices(marketData);
  }, [marketData, setPrices]);

  // Poll DM conversations globally so unread badge updates on any tab
  const { data: dmData } = useDMConversations();
  const prevDMCount = useRef(0);
  useEffect(() => {
    if (dmData?.conversations) {
      if (dmData.conversations.length > prevDMCount.current && prevDMCount.current > 0) {
        playNotificationSound();
      }
      prevDMCount.current = dmData.conversations.length;
      setConversations(dmData.conversations);
    }
  }, [dmData, setConversations]);

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

export function MainLayout() {
  return (
    <Suspense>
      <MainLayoutInner />
    </Suspense>
  );
}
