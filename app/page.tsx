import { FeedPanel } from "@/components/feed/feed-panel";

export default function Home() {
  return (
    <div className="flex flex-1 h-full">
      {/* Left: tab content (placeholder for now) */}
      <main className="flex-1 flex items-center justify-center border-r border-border">
        <h1 className="font-mono text-2xl tracking-wide text-muted-foreground">
          MONITORING THE SITUATION
        </h1>
      </main>

      {/* Right: tweet feed (~35%) */}
      <div className="w-100 shrink-0">
        <FeedPanel />
      </div>
    </div>
  );
}
