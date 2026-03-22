import { TickerTape } from "./ticker-tape";

export function Header() {
  return (
    <header className="shrink-0">
      <div className="border-b border-border px-6 h-10 flex items-center justify-center">
        <h1 className="font-mono text-sm font-semibold tracking-widest text-muted-foreground">
          SITUATION MONITOR
        </h1>
      </div>
      <TickerTape />
    </header>
  );
}
