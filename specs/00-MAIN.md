# Monitoring the Situation — Main Spec

## Concept

A satirical stock-market/news simulation app themed around the "monitoring the situation" meme. The user is a self-important armchair analyst "monitoring" a ridiculous simulated world where CEOs resign over fishing rights, countries declare war over cheese tariffs, and insider tips come via DMs from shady characters named things like "GoldBug_Larry69."

The entire world is simulated — real countries and cities, fake people. Events span the absurdity spectrum of the 15th–21st century. No LLMs required for v1 — all content is template-driven with simple interfaces so LLMs can be plugged in later.

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js (App Router) |
| Database | @upstash/redis (with Redis Search) |
| Event execution | @upstash/workflow |
| Periodic triggers | @upstash/qstash (schedule) |
| State management | Zustand (persisted to localStorage) |
| Data fetching | TanStack Query |
| UI components | shadcn/ui + Tailwind |
| Validation | Zod |

## Architecture Overview

```
┌──────────────────────────────────────────────────┐
│                   FRONTEND                       │
│                                                  │
│  ┌──────────────────────────────┐  ┌──────────┐  │
│  │  Tabs:                       │  │  Tweet   │  │
│  │  - News                      │  │  Feed    │  │
│  │  - Stock Market & Prices     │  │  (right) │  │
│  │  - Portfolio (local)         │  │          │  │
│  │  - DMs                       │  │          │  │
│  └──────────────────────────────┘  └──────────┘  │
│                                                  │
│  Zustand stores ←→ TanStack Query ←→ API routes  │
│  localStorage ←→ portfolio, likes, DM read state │
└──────────────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────┐
│                   BACKEND                        │
│                                                  │
│  Next.js API Routes                              │
│  ├── /api/tweets     (list/new-count)            │
│  ├── /api/news       (list/get)                  │
│  ├── /api/market     (prices/sectors/companies)  │
│  ├── /api/dms        (list/get)                  │
│  ├── /api/workflow   (upstash workflow endpoint) │
│  └── /api/tick       (frontend-driven trigger)    │
│                                                  │
│  @upstash/redis  ←→  all data + search indexes   │
│  @upstash/workflow ←→ event execution            │
│  @upstash/qstash  ←→ workflow trigger (via tick)  │
└──────────────────────────────────────────────────┘
```

## User Identity

- On first visit, generate a UUID and store in localStorage
- User ID is **not** sent to the backend — all user-specific state lives in the browser
- localStorage tracks: liked tweets, portfolio (holdings, cash, transactions), DM read status
- Users start with a fixed amount of simulated cash (e.g., $100,000) stored in localStorage

## Data Flow

1. **Frontend polls** `POST /api/tick` every 10 seconds
2. **Tick endpoint** checks `sim:last_event_time` in Redis — if >60s elapsed, triggers the workflow via QStash publish; otherwise returns `event-not-started` (200)
3. **Workflow** picks a random seed event from the registry
4. Seed event handler runs in workflow steps (`ctx.run`), producing tweets/news/DMs/price changes
5. Handler returns follow-up events chained sequentially (DM → tweet → outcome) with delays
6. Workflow executes follow-ups, sleeping between delayed steps
7. Frontend polls for new content via TanStack Query (tweets every 10s, news every 15s)

This design means the simulation only runs while someone has the app open — no wasted compute.

## Key Design Principles

- **Template-first**: All content (tweets, news, DMs) generated from templates with slot-filling. Interfaces are simple so LLM generation can be swapped in later.
- **Event-driven**: Everything that happens in the simulation is an event. Events have Zod schemas, handlers, and produce follow-up events.
- **Redis Search**: Tweets, news, and DMs are stored as JSON documents with Redis Search indexes for querying, sorting, filtering, and counting. No manual sorted sets needed.
- **Client-side user state**: Portfolio, likes, and read status live in localStorage/Zustand. The backend is stateless with respect to users — it only manages the simulation.
- **Deterministic randomness**: Stock prices use seeded PRNG + brownian motion so the same seed produces the same price history. Events use randomness but are reproducible given the same seed.

## File Structure (Target)

```
monitoring-the-situation/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── api/
│   │       ├── tweets/route.ts
│   │       ├── news/route.ts
│   │       ├── market/route.ts
│   │       ├── dms/route.ts
│   │       ├── workflow/route.ts
│   │       └── schedule/route.ts
│   ├── lib/
│   │   ├── redis.ts
│   │   ├── search.ts              (Redis Search index definitions)
│   │   ├── interfaces/
│   │   │   ├── tweets.ts
│   │   │   ├── news.ts
│   │   │   ├── market.ts
│   │   │   └── dms.ts
│   │   ├── events/
│   │   │   ├── registry.ts
│   │   │   ├── schemas.ts
│   │   │   ├── seed.ts
│   │   │   ├── chains/
│   │   │   │   ├── insider-trading.ts
│   │   │   │   ├── ceo-scandal.ts
│   │   │   │   ├── sector-boom.ts
│   │   │   │   ├── diplomatic-incident.ts
│   │   │   │   └── ... more chains
│   │   │   └── templates/
│   │   │       ├── tweets.ts
│   │   │       ├── news.ts
│   │   │       └── dms.ts
│   │   ├── market/
│   │   │   ├── companies.ts
│   │   │   ├── sectors.ts
│   │   │   ├── pricing.ts       (brownian motion + sector calc)
│   │   │   └── seed-data.ts
│   │   └── simulation/
│   │       ├── personas.ts      (fake twitter accounts)
│   │       ├── world.ts         (countries, cities, orgs)
│   │       └── names.ts         (name generators)
│   ├── stores/
│   │   ├── feed.ts
│   │   ├── market.ts
│   │   ├── portfolio.ts         (persisted to localStorage)
│   │   └── dms.ts
│   ├── hooks/
│   │   ├── use-tweets.ts
│   │   ├── use-news.ts
│   │   ├── use-market.ts
│   │   ├── use-portfolio.ts     (local only, no API)
│   │   └── use-dms.ts
│   └── components/
│       ├── feed/
│       ├── news/
│       ├── market/
│       ├── portfolio/
│       ├── dms/
│       └── ui/ (shadcn)
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## Spec Files

| File | Covers |
|------|--------|
| `01-EVENTS.md` | Event system, registry, Zod schemas, workflow integration, seed events |
| `02-TWEETS.md` | Tweet interface, feed, personas, templates |
| `03-NEWS.md` | News interface, article templates, news accounts |
| `04-DMS.md` | DM interface, insider characters, speculation messages |
| `05-MARKET.md` | Companies, sectors, indexes, pricing formula, brownian motion |
| `06-PORTFOLIO.md` | Client-side portfolio, buy/sell, cash management |
| `07-FRONTEND.md` | UI layout, stores, hooks, components, polling |
| `08-EVENT-CHAINS.md` | All creative event chain definitions |
| `09-MILESTONES.md` | Implementation plan broken into milestones |
