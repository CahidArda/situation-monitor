"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const MainLayout = dynamic(
  () => import("./main-layout").then((m) => m.MainLayout),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-1 h-dvh">
        <div className="flex-[0.65] min-w-0" />
        <div className="flex flex-col flex-[0.35] min-w-0 border-l border-border bg-background">
          <div className="border-b border-border px-4 py-3">
            <h2 className="font-mono text-sm font-semibold tracking-wide text-muted-foreground">
              FEED
            </h2>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    ),
  },
);

export function MainShell({
  content,
  feed,
}: {
  content: React.ReactNode;
  feed: React.ReactNode;
}) {
  return <MainLayout content={content} feed={feed} />;
}
