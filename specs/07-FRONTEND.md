# 07 — Frontend Spec

## Layout

Two-panel layout:

```
┌──────────────────────────────────┬────────────────┐
│                                   │                │
│           Tab Content             │   Tweet Feed   │
│           (left ~65%)             │   (right ~35%) │
│                                   │                │
│  ┌─────┬────────┬──────┬──────┐  │  ┌──────────┐  │
│  │News │ Market │Port. │ DMs  │  │  │ N new    │  │
│  └─────┴────────┴──────┴──────┘  │  │ tweets   │  │
│                                   │  ├──────────┤  │
│  [Tab content renders here]       │  │ Tweet    │  │
│                                   │  │ Tweet    │  │
│                                   │  │ Tweet    │  │
│                                   │  │ Tweet    │  │
│                                   │  │ ...      │  │
│                                   │  │          │  │
│                                   │  └──────────┘  │
└──────────────────────────────────┴────────────────┘
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
  likedTweetIds: Set<string>;     // persisted to localStorage

  // Actions
  setTweets: (tweets: Tweet[]) => void;
  prependTweets: (tweets: Tweet[]) => void;
  appendTweets: (tweets: Tweet[]) => void;
  setNewTweetCount: (count: number) => void;
  showNewTweets: () => void;      // loads buffered new tweets
  toggleLike: (tweetId: string) => void; // toggles in likedTweetIds (localStorage)
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

### Portfolio Store (persisted to localStorage)

```typescript
// stores/portfolio.ts
interface PortfolioStore {
  cash: number;
  holdings: PortfolioHolding[];
  transactions: Transaction[];

  // Actions
  buy: (asset: {
    assetId: string;
    assetType: "stock" | "commodity";
    ticker: string;
    name: string;
    quantity: number;
    price: number;
  }) => boolean; // returns false if insufficient cash
  sell: (assetId: string, quantity: number, price: number) => boolean;
  getComputedPortfolio: (marketPrices: Map<string, number>) => ComputedPortfolio;
}
```

Persisted via `zustand/middleware/persist` with `localStorage` backend. Initialized with $100,000 cash on first visit.

### DM Store

```typescript
// stores/dms.ts
interface DMStore {
  conversations: DMConversation[];
  activeConversation: string | null;   // personaId
  messages: Record<string, DirectMessage[]>; // personaId -> messages
  readTimestamps: Record<string, number>;   // personaId -> lastReadTimestamp (persisted to localStorage)

  setConversations: (data: DMConversation[]) => void;
  setMessages: (personaId: string, messages: DirectMessage[]) => void;
  setActiveConversation: (personaId: string | null) => void;
  markRead: (personaId: string) => void; // updates readTimestamps in localStorage
  getUnreadCount: (personaId: string) => number; // derived from readTimestamps vs lastTimestamp
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

// hooks/use-dms.ts
function useDMConversations() {
  return useQuery({
    queryKey: ["dms", "conversations"],
    queryFn: () => fetchConversations(),
    refetchInterval: 10_000,
  });
}

function useDMMessages(personaId: string) {
  return useQuery({
    queryKey: ["dms", "messages", personaId],
    queryFn: () => fetchMessages(personaId),
    enabled: !!personaId,
  });
}
```

API fetch helper (no user identity header):

```typescript
async function apiFetch(path: string, options?: RequestInit) {
  return fetch(path, {
    ...options,
    headers: {
      ...options?.headers,
      "Content-Type": "application/json",
    },
  });
}
```

## Component Tree

```
<App>
├── <Header>                    // "MONITORING THE SITUATION" + ticker tape
├── <MainLayout>
│   ├── <ContentPanel>          // Left panel
│   │   ├── <TabBar>            // News | Market | Portfolio | DMs (with badges)
│   │   ├── <NewsTab>
│   │   │   ├── <CategoryFilter>
│   │   │   ├── <NewsCardList>
│   │   │   │   └── <NewsCard>
│   │   │   └── <NewsArticleModal>
│   │   ├── <MarketTab>
│   │   │   ├── <GlobalIndexBar>
│   │   │   ├── <SectorRow>
│   │   │   │   └── <SectorCard>
│   │   │   ├── <CommodityRow>
│   │   │   │   └── <CommodityCard>
│   │   │   ├── <CompanyTable>
│   │   │   │   └── <CompanyRow>
│   │   │   └── <CompanyDetailSheet>  // slide-out with chart + buy/sell
│   │   ├── <PortfolioTab>
│   │   │   ├── <PortfolioSummary>    // cash, total value, total P&L
│   │   │   ├── <HoldingsTable>
│   │   │   │   └── <HoldingRow>
│   │   │   └── <TransactionHistory>
│   │   └── <DMsTab>
│   │       ├── <ConversationList>
│   │       │   └── <ConversationPreview>
│   │       └── <MessageThread>
│   │           └── <MessageBubble>
│   └── <FeedPanel>             // Right panel
│       ├── <NewTweetsBanner>   // "Show N new tweets"
│       ├── <TweetList>
│       │   └── <TweetCard>     // handle, display name, content, like button, timestamp
│       └── <LoadMoreSpinner>
└── <Footer>                    // optional: clock, tick counter, status
```

## Responsive Behavior

- **Desktop (>1024px)**: Side-by-side panels
- **Tablet (768–1024px)**: Feed panel becomes collapsible sidebar
- **Mobile (<768px)**: Feed becomes a tab alongside News/Market/Portfolio/DMs, or a bottom sheet
