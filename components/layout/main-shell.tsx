"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { NAV_ITEMS } from "./navbar";

const MainLayout = dynamic(
  () => import("./main-layout").then((m) => m.MainLayout),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-dvh">
        {/* Top bar */}
        <header className="shrink-0">
          <div className="border-b border-border px-6 h-10 flex items-center justify-center">
            <h1 className="font-mono text-sm font-semibold tracking-widest text-muted-foreground">
              SITUATION MONITOR
            </h1>
          </div>
          <div className="border-b border-border h-6 bg-accent/20" />
        </header>

        {/* Sub-navbars + content */}
        <div className="flex flex-1 w-[80%] mx-auto min-h-0">
          {/* Left: tabs sub-nav + loader */}
          <div className="flex flex-col flex-[0.6] min-w-0">
            <div className="border-b border-border px-4 h-10 flex items-center shrink-0">
              <nav className="flex items-center gap-1">
                {NAV_ITEMS.map((item) => (
                  <span
                    key={item.id}
                    className="px-3 py-1 text-sm text-muted-foreground rounded-md"
                  >
                    {item.label}
                  </span>
                ))}
              </nav>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          </div>

          {/* Right: feed sub-nav + loader */}
          <div className="flex flex-col flex-[0.4] min-w-0 border-l border-border">
            <div className="border-b border-border px-4 h-10 flex items-center shrink-0">
              <h2 className="font-mono text-sm font-semibold tracking-wide text-muted-foreground">
                FEED
              </h2>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>
    ),
  },
);

export function MainShell() {
  return <MainLayout />;
}
