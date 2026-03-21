"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

export function MainLayout({
  content,
  feed,
}: {
  content: React.ReactNode;
  feed: React.ReactNode;
}) {
  return (
    <ResizablePanelGroup
      id="main-layout"
      orientation="horizontal"
      style={{ height: "100vh" }}
    >
      <ResizablePanel id="content" defaultSize="65%" minSize="30%">
        {content}
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel id="feed" defaultSize="35%" minSize={300} maxSize="55%">
        {feed}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
