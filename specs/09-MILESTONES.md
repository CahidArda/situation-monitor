# 09 — Milestones

## Philosophy

Get a working loop first: events → content → visible in UI. Then add complexity layer by layer. Stock market is added after the core simulation loop is proven and working.

---

## Milestone 1: Project Skeleton & Data Layer

**Goal**: Next.js project boots, Redis connects, data interfaces are defined, seed data exists.

### Tasks

1. **Project init**
   - `create-next-app` with App Router, TypeScript, Tailwind
   - Install deps: `@upstash/redis`, `@upstash/workflow`, `@upstash/qstash`, `zod`, `zustand`, `@tanstack/react-query`, `nanoid`
   - Set up shadcn/ui (dark mode default)
   - Environment variables: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY`, `SCHEDULE_SECRET`

2. **Redis client**
   - `lib/redis.ts`: export singleton `Redis` instance from `@upstash/redis`

3. **Data interfaces (types only, no implementation yet)**
   - `lib/interfaces/tweets.ts` — `TweetInterface` type
   - `lib/interfaces/news.ts` — `NewsInterface` type
   - `lib/interfaces/dms.ts` — `DMInterface` type
   - Shared types: `Tweet`, `NewsArticle`, `DirectMessage`, `DMConversation`, `Persona`

4. **Seed data**
   - `lib/simulation/personas.ts` — 15–20 personas defined
   - `lib/simulation/world.ts` — countries, cities, organizations pool
   - `lib/simulation/names.ts` — random name generator (first + last from pools)

5. **Verify**: app runs locally, Redis connects, types compile

### Deliverable
Working Next.js app that connects to Redis. No UI, no API routes yet — just the foundation.

---

## Milestone 2: Tweet System (Backend + Frontend)

**Goal**: Tweets can be written (programmatically) and displayed in the feed. Like/unlike works. "New tweets" banner works.

### Tasks

1. **Tweet backend implementation**
   - `lib/interfaces/tweets.ts`: implement `write()`, `list()`, `like()`, `unlike()`, `getLikedStatus()`, `getNewCount()`
   - All backed by Redis sorted sets and hashes

2. **Tweet API routes**
   - `GET /api/tweets` — list tweets
   - `GET /api/tweets/new-count` — count since timestamp
   - `POST /api/tweets/like` — like a tweet
   - `DELETE /api/tweets/like` — unlike

3. **Tweet templates**
   - `lib/events/templates/tweets.ts` — 20–30 tweet templates across categories
   - Template selector function: given event type + persona type → pick random template → fill slots

4. **Feed frontend**
   - `stores/feed.ts` — Zustand store
   - `hooks/use-tweets.ts` — TanStack Query hooks (tweets + new count)
   - `components/feed/TweetCard.tsx` — single tweet display
   - `components/feed/TweetList.tsx` — scrollable list
   - `components/feed/NewTweetsBanner.tsx` — "Show N new tweets" button
   - `components/feed/FeedPanel.tsx` — container with polling logic

5. **Test helper**: temporary API route `POST /api/debug/tweet` that writes a random tweet (to test feed without events)

### Deliverable
Left panel shows tweets. New tweets appear every 10s (via test helper or manual insertion). "New tweets" banner works. Like/unlike works.

---

## Milestone 3: News & DM System (Backend + Frontend)

**Goal**: News articles and DMs can be written and read. Tab UI is functional.

### Tasks

1. **News backend**
   - Implement `NewsInterface`: `write()`, `list()`, `get()`
   - News API routes: `GET /api/news`, `GET /api/news/[id]`

2. **News templates**
   - `lib/events/templates/news.ts` — 10–15 news article templates

3. **DM backend**
   - Implement `DMInterface`: `send()`, `listConversations()`, `listMessages()`, `markRead()`, `getUnreadCount()`
   - DM API routes: `GET /api/dms`, `GET /api/dms/[personaId]`, `POST /api/dms/[personaId]/read`

4. **DM templates**
   - `lib/events/templates/dms.ts` — 15–20 DM templates by type

5. **User ID system**
   - `lib/user.ts` — UUID generation + localStorage
   - Shared fetch wrapper with `x-user-id` header
   - `POST /api/init` — initialize user (called on app load, creates portfolio etc if new)

6. **Tab UI**
   - Main layout: left panel (feed) + right panel (tabs)
   - `components/TabBar.tsx` — News | DMs tabs (Market + Portfolio tabs exist but show "Coming soon")
   - `components/news/NewsTab.tsx`, `NewsCard.tsx`, `NewsArticleView.tsx`
   - `components/dms/DMsTab.tsx`, `ConversationList.tsx`, `MessageThread.tsx`
   - Zustand stores + TanStack hooks for news and DMs
   - Unread badge on DMs tab

7. **Test helpers**: debug routes to insert test news articles and DMs

### Deliverable
Full two-panel layout. Feed on left, tabs on right. News tab shows articles, DMs tab shows conversations. All data comes from Redis.

---

## Milestone 4: Event System & Workflow

**Goal**: Events fire via @upstash/workflow, producing tweets/news/DMs. QStash schedule triggers periodic seeds.

### Tasks

1. **Event registry**
   - `lib/events/registry.ts` — register/get events, seed event selection
   - `lib/events/schemas.ts` — shared Zod schemas

2. **Workflow endpoint**
   - `api/workflow/route.ts` — @upstash/workflow serve()
   - Handles seed triggers and event execution
   - Recursive follow-up execution

3. **Implement 2–3 simple event chains**
   - `insider-trading` chain (full flow: DM → tweet → market hint → outcome)
   - `ceo-scandal` chain (rumor → speculation → resolution)
   - `noise` events (random tweets, commentary, memes)

4. **Simulation state**
   - `lib/events/state.ts` — read/write sim state in Redis (tick, active chains, cooldowns)
   - Active user tracking

5. **QStash schedule**
   - `api/schedule/route.ts` — create/verify QStash schedule
   - Protected by `SCHEDULE_SECRET` env var
   - Checks if schedule already exists before creating
   - Schedule fires every 20 seconds → hits workflow endpoint

6. **End-to-end test**
   - Call schedule endpoint to start the loop
   - Observe tweets/news/DMs appearing in the UI organically

### Deliverable
The simulation runs autonomously. Every ~20 seconds, a seed event may fire, producing a chain of tweets, news, and DMs that appear in the UI. The app feels alive.

---

## Milestone 5: More Event Chains & Polish

**Goal**: Richer simulation with more chains, concurrent events, and better content.

### Tasks

1. **Additional event chains**
   - `diplomatic-incident` chain
   - `pump-and-dump` chain
   - `product-launch` chain
   - More noise events (10–15 varieties)

2. **Concurrent chain management**
   - Track active chains in Redis
   - Max concurrent chain limit
   - Chain cooldowns

3. **Content expansion**
   - More tweet templates (50+ total)
   - More news templates (25+ total)
   - More DM templates (30+ total)
   - More personas (20–25 total)
   - More scandal reasons, product ideas, diplomatic causes

4. **Feed quality**
   - Multiple personas reacting to the same event
   - Reply-like tweet chains (quote-tweet style references)
   - News accounts tweeting links to their own articles

5. **UI polish**
   - "MONITORING THE SITUATION" header with animated radar
   - Ticker tape at top (scrolling text of price changes / breaking news)
   - Loading states, empty states, error states
   - Mobile responsive layout
   - Smooth animations on new content

### Deliverable
Rich, entertaining simulation with diverse events. Multiple chains running simultaneously. The feed feels alive and funny.

---

## Milestone 6: Stock Market & Pricing

**Goal**: Full stock market with companies, sectors, commodities, dynamic pricing.

### Tasks

1. **Market data layer**
   - `lib/market/sectors.ts` — sector definitions
   - `lib/market/companies.ts` — company definitions (15–20 companies)
   - `lib/market/pricing.ts` — price calculation (brownian motion + sector influence)
   - `lib/market/seed-data.ts` — initial values

2. **Market interface**
   - `lib/interfaces/market.ts` — implement full interface
   - Market API routes: `GET /api/market`, `GET /api/market/history`, `GET /api/market/company/[id]`

3. **Market tick integration**
   - Workflow seed event also triggers market tick
   - Sector index updates on each tick based on status
   - Price history stored (last 200 ticks)

4. **Event → market connection**
   - Events modify sector indexes and company base values
   - `sector-shift` chain (long-running bull/bear transitions)
   - Existing chains updated to include price impact

5. **Market frontend**
   - `components/market/MarketTab.tsx`
   - `components/market/GlobalIndexBar.tsx` — with sparkline
   - `components/market/SectorRow.tsx` — sector cards
   - `components/market/CommodityRow.tsx` — oil/gold/silver/fish
   - `components/market/CompanyTable.tsx` — full list
   - `components/market/CompanyDetail.tsx` — expanded view with chart
   - Sparkline charts (lightweight, maybe recharts or custom SVG)

### Deliverable
Working stock market with real-time price updates. Prices influenced by events. Sectors drive companies.

---

## Milestone 7: Portfolio & Trading

**Goal**: Users can buy/sell stocks and commodities. Portfolio tracking works.

### Tasks

1. **Portfolio backend**
   - `lib/interfaces/portfolio.ts` — implement full interface
   - Portfolio API routes: `GET /api/portfolio`, `POST /api/portfolio/buy`, `POST /api/portfolio/sell`, `GET /api/portfolio/transactions`
   - User initialization with starting cash ($100,000)

2. **Trading UI**
   - Buy/sell dialog accessible from Market tab (company detail view)
   - Quantity input, estimated cost, cash remaining
   - Confirmation step

3. **Portfolio frontend**
   - `components/portfolio/PortfolioTab.tsx`
   - `components/portfolio/PortfolioSummary.tsx` — cash, total value, P&L
   - `components/portfolio/HoldingsTable.tsx` — current holdings with live prices
   - `components/portfolio/TransactionHistory.tsx` — past trades
   - Quick-sell button on each holding

4. **Integration**
   - Portfolio values update as market prices change
   - After buying based on a DM tip, see if it pays off

### Deliverable
Complete trading experience. Users can act on insider DMs and market analysis to trade. Portfolio tracks P&L in real time.

---

## Milestone 8: Final Polish & Fun

**Goal**: The app is complete, polished, and genuinely funny.

### Tasks

1. **Header & chrome**
   - Animated "MONITORING THE SITUATION" header
   - Scrolling ticker tape with latest prices and breaking news
   - Optional CRT/scanline overlay toggle
   - Favicon, meta tags

2. **Sound effects** (optional)
   - Notification ping for new DMs
   - Cash register sound on trades
   - Breaking news alert sound

3. **Easter eggs**
   - Rare events: "a meteor has landed on the stock exchange" (all prices freeze)
   - Extremely rare persona: time-traveling trader from the 15th century
   - If portfolio drops to $0: "congratulations, you have been monitoring the situation"

4. **Performance**
   - Redis pipeline for batch reads
   - TanStack Query deduplication
   - Optimistic updates for likes/trades

5. **Documentation**
   - README with setup instructions
   - How to add new event chains
   - How to add LLM-generated content later

### Deliverable
Polished, delightful app ready to share.

---

## Milestone Summary

| # | Name | Focus | Depends On |
|---|------|-------|------------|
| 1 | Skeleton & Data | Project setup, types, seed data | — |
| 2 | Tweets | Feed backend + frontend, templates | 1 |
| 3 | News & DMs | News + DM backend + frontend, tabs | 1, 2 |
| 4 | Event System | Workflow, registry, 2-3 chains, QStash | 1, 2, 3 |
| 5 | More Events | Richer content, concurrent chains, polish | 4 |
| 6 | Stock Market | Pricing engine, sectors, market UI | 4 |
| 7 | Portfolio | Trading, portfolio tracking | 6 |
| 8 | Final Polish | Header, sounds, easter eggs, perf | All |
