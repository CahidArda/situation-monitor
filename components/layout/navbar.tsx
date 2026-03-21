import { cn } from "@/lib/utils";

export type NavItem = {
  id: string;
  label: string;
  disabled?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { id: "news", label: "News" },
  { id: "market", label: "Market", disabled: true },
  { id: "portfolio", label: "Portfolio", disabled: true },
  { id: "dms", label: "DMs" },
];

export function Navbar({
  activeTab,
  onTabChange,
  badge,
}: {
  activeTab?: string;
  onTabChange?: (id: string) => void;
  badge?: Record<string, number>;
}) {
  return (
    <div className="border-b border-border px-4 h-11 flex items-center gap-6">
      <h1 className="font-mono text-sm font-semibold tracking-wide text-muted-foreground shrink-0">
        MONITORING THE SITUATION
      </h1>
      <nav className="flex items-center gap-1 ml-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          const count = badge?.[item.id] ?? 0;

          return (
            <button
              key={item.id}
              onClick={() => !item.disabled && onTabChange?.(item.id)}
              disabled={item.disabled}
              className={cn(
                "relative px-3 py-1 text-sm rounded-md transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                item.disabled && "opacity-40 cursor-not-allowed",
              )}
            >
              {item.label}
              {count > 0 && (
                <span className="absolute -top-1 -right-1 h-4 min-w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
