# 07 — Frontend Spec

## Layout

Two-panel layout:

```
┌────────────────┬──────────────────────────────────┐
│                │                                   │
│   Tweet Feed   │           Tab Content             │
│   (left ~35%)  │           (right ~65%)            │
│                │                                   │
│  ┌──────────┐  │  ┌─────┬────────┬──────┬──────┐  │
│  │ N new    │  │  │News │ Market │Port. │ DMs  │  │
│  │ tweets   │  │  └─────┴────────┴──────┴──────┘  │
│  ├──────────┤  │                                   │
│  │ Tweet    │  │  [Tab content renders here]       │
│  │ Tweet    │  │                                   │
│  │ Tweet    │  │                                   │
│  │ Tweet    │  │                                   │
│  │ ...      │  │                                   │
│  │          │  │                                   │
│  └──────────┘  │                                   │
└────────────────┴──────────────────────────────────┘
```

On mobile, the tweet feed collapses into its own tab or a swipeable panel.

## Design Direction

**Theme: "War Room Meets Doomscrolling"**

- Dark mode by default. Think: Bloomberg terminal meets Twitter dark mode.
- Monospace or semi-monospace fonts for data (prices, tickers). Clean sans-serif for content.
- Green/red for market movement. Yellow/amber for alerts and breaking news.
- Subtle scan-line or CRT effect on the header/ticker bar (very subtle, not distracting).
- "MONITORING THE SITUATION" watermark/header with an animated radar sweep or blinking dot.
- Notification sounds optional (toggle in settings).

### Color Palette (CSS Variables)

```css
:root {
  --bg-primary: #0a0e17;
  --bg-secondary: #111827;
  --bg-card: #1a2035;
  --bg-hover: #243052;
  --text-primary: #e5e7eb;
  --text-secondary: #9ca3af;
  --text-muted: #6b7280;
  --accent-green: #22c55e;
  --accent-red: #ef4444;
  --accent-yellow: #f59e0b;
  --accent-blue: #3b82f6;
  --border: #1f2937;
  --ticker-bg: #0f1729;
}
```

### Typography

- Headings: JetBrains Mono or IBM Plex Mono
- Body: system sans-serif stack or Geist Sans
- Data/numbers: JetBrains Mono (tabular nums)

## Zustand Stores

### Feed Store

```typescript
// stores/feed.ts
interface FeedStore {
  tweets: Tweet[];
  latestTimestamp: number;
  newTweetCount: number;          // unviewed new tweets
  isLoadingMore: boolean;
  hasMore: boolean;

  // Actions
  setTweets: (tweets: Tweet[]) => void;
  prependTweets: (tweets: Tweet[]) => void;
  appendTweets: (tweets: Tweet[]) => void;
  setNewTweetCount: (count: number) => void;
  showNewTweets: () => void;      // loads buffered new tweets
  toggleLike: (tweetId: string) => void;
}
```

### Market Store

```typescript
// stores/market.ts
interface MarketStore {
  companies: (Company & { currentPrice: number; change: number; changePercent: number })[];
  commodities: (Commodity & { currentPrice: number; change: number; changePercent: number })[];
  sectors: Sector[];
  globalIndex: { value: number; change: number; changePercent: number };
  selectedCompany: string | null;
  selectedSector: string | null;

  // Actions
  setPrices: (data: MarketPricesResponse) => void;
  selectCompany: (id: string | null) => void;
  selectSector: (id: string | null) => void;
}
```

### Portfolio Store

```typescript
// stores/portfolio.ts
interface PortfolioStore {
  cash: number;
  holdings: PortfolioHolding[];
  totalValue: number;
  totalPnl: number;
  transactions: Transaction[];
  isLoading: boolean;

  setPortfolio: (data: Portfolio) => void;
  setTransactions: (data: Transaction[]) => void;
}
```

### DM Store

```typescript
// stores/dms.ts
interface DMStore {
  conversations: DMConversation[];
  activeConversation: string | null;   // personaId
  messages: Record<string, DirectMessage[]>; // personaId -> messages
  totalUnread: number;

  setConversations: (data: DMConversation[]) => void;
  setMessages: (personaId: string, messages: DirectMessage[]) => void;
  setActiveConversation: (personaId: string | null) => void;
  decrementUnread: (personaId: string) => void;
}
```

## TanStack Query Hooks

```typescript
// hooks/use-tweets.ts
function useTweets() {
  return useQuery({
    queryKey: ["tweets"],
    queryFn: () => fetchTweets(),
    refetchInterval: false, // manual polling via new-count
  });
}

function useNewTweetCount(afterTs: number) {
  return useQuery({
    queryKey: ["tweets", "new-count", afterTs],
    queryFn: () => fetchNewTweetCount(afterTs),
    refetchInterval: 10_000,  // every 10 seconds
    enabled: afterTs > 0,
  });
}

// hooks/use-market.ts
function useMarketPrices() {
  return useQuery({
    queryKey: ["market", "prices"],
    queryFn: () => fetchMarketPrices(),
    refetchInterval: 4_000,  // every 4 seconds
  });
}

function usePriceHistory(type: string, id: string) {
  return useQuery({
    queryKey: ["market", "history", type, id],
    queryFn: () => fetchPriceHistory(type, id),
    refetchInterval: 10_000,
  });
}

// hooks/use-news.ts
function useNews() {
  return useQuery({
    queryKey: ["news"],
    queryFn: () => fetchNews(),
    refetchInterval: 15_000,  // every 15 seconds
  });
}

// hooks/use-portfolio.ts
function usePortfolio() {
  return useQuery({
    queryKey: ["portfolio"],
    queryFn: () => fetchPortfolio(),
    refetchInterval: 10_000,
  });
}

function useBuyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params) => buyAsset(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });
}

// hooks/use-dms.ts
function useDMConversations() {
  return useQuery({
    queryKey: ["dms", "conversations"],
    queryFn: () => fetchConversations(),
    refetchInterval: 10_000,
  });
}
```

## Component Tree

```
<App>
├── <Header>                    // "MONITORING THE SITUATION" + ticker tape
├── <MainLayout>
│   ├── <FeedPanel>             // Left panel
│   │   ├── <NewTweetsBanner>   // "Show N new tweets"
│   │   ├── <TweetList>
│   │   │   └── <TweetCard>     // avatar, handle, content, like button, timestamp
│   │   └── <LoadMoreSpinner>
│   └── <ContentPanel>          // Right panel
│       ├── <TabBar>            // News | Market | Portfolio | DMs (with badges)
│       ├── <NewsTab>
│       │   ├── <CategoryFilter>
│       │   ├── <NewsCardList>
│       │   │   └── <NewsCard>
│       │   └── <NewsArticleModal>
│       ├── <MarketTab>
│       │   ├── <GlobalIndexBar>
│       │   ├── <SectorRow>
│       │   │   └── <SectorCard>
│       │   ├── <CommodityRow>
│       │   │   └── <CommodityCard>
│       │   ├── <CompanyTable>
│       │   │   └── <CompanyRow>
│       │   └── <CompanyDetailSheet>  // slide-out with chart + buy/sell
│       ├── <PortfolioTab>
│       │   ├── <PortfolioSummary>    // cash, total value, total P&L
│       │   ├── <HoldingsTable>
│       │   │   └── <HoldingRow>
│       │   └── <TransactionHistory>
│       └── <DMsTab>
│           ├── <ConversationList>
│           │   └── <ConversationPreview>
│           └── <MessageThread>
│               └── <MessageBubble>
└── <Footer>                    // optional: clock, tick counter, status
```

## User ID Management

```typescript
// lib/user.ts
function getUserId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("mts-user-id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("mts-user-id", id);
  }
  return id;
}
```

Injected into all API calls via a shared fetch wrapper:

```typescript
async function apiFetch(path: string, options?: RequestInit) {
  return fetch(path, {
    ...options,
    headers: {
      ...options?.headers,
      "x-user-id": getUserId(),
      "Content-Type": "application/json",
    },
  });
}
```

## Responsive Behavior

- **Desktop (>1024px)**: Side-by-side panels
- **Tablet (768–1024px)**: Feed panel becomes collapsible sidebar
- **Mobile (<768px)**: Feed becomes a tab alongside News/Market/Portfolio/DMs, or a bottom sheet
