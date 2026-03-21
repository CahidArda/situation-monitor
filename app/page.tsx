import { FeedPanel } from "@/components/feed/feed-panel";
import { MainShell } from "@/components/layout/main-shell";

export default function Home() {
  return (
    <MainShell
      content={
        <main className="flex flex-1 items-center justify-center h-full">
          <h1 className="font-mono text-2xl tracking-wide text-muted-foreground">
            MONITORING THE SITUATION
          </h1>
        </main>
      }
      feed={<FeedPanel />}
    />
  );
}
