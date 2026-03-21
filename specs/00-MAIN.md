# Monitoring the Situation — Main Spec

## Concept

A satirical stock-market/news simulation app themed around the "monitoring the situation" meme. The user is a self-important armchair analyst "monitoring" a ridiculous simulated world where CEOs resign over fishing rights, countries declare war over cheese tariffs, and insider tips come via DMs from shady characters named things like "GoldBug_Larry69."

The entire world is simulated — real countries and cities, fake people. Events span the absurdity spectrum of the 15th–21st century. No LLMs required for v1 — all content is template-driven with simple interfaces so LLMs can be plugged in later.

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js (App Router) |
| Database | @upstash/redis |
| Event execution | @upstash/workflow |
| Periodic triggers | @upstash/qstash (schedule) |
| State management | Zustand |
| Data fetching | TanStack Query |
| UI components | shadcn/ui + Tailwind |
| Validation | Zod |

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                   FRONTEND                       │
│                                                  │
│  ┌──────────┐  ┌──────────────────────────────┐  │
│  │  Tweet    │  │  Tabs:                       │  │
│  │  Feed     │  │  - News                      │  │
│  │  (left)   │  │  - Stock Market & Prices     │  │
│  │          │  │  - Portfolio                  │  │
│  │          │  │  - DMs                        │  │
│  └──────────┘  └──────────────────────────────┘  │
│                                                  │
│  Zustand stores ←→ TanStack Query ←→ API routes  │
└─────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────┐
│                   BACKEND                        │
│                                                  │
│  Next.js API Routes                              │
│  ├── /api/tweets     (list/like/unlike/write)    │
│  ├── /api/news       (list/get/write)            │
│  ├── /api/market     (prices/sectors/companies)  │
│  ├── /api/portfolio  (get/buy/sell)              │
│  ├── /api/dms        (list/get)                  │
│  ├── /api/workflow   (upstash workflow endpoint)  │
│  └── /api/schedule   (setup qstash schedule)     │
│                                                  │
│  @upstash/redis  ←→  all data                    │
│  @upstash/workflow ←→ event execution            │
│  @upstash/qstash  ←→ periodic seed triggers      │
└─────────────────────────────────────────────────┘
```

## User Identity

- On first visit, generate a UUID and store in localStorage
- Send as `x-user-id` header on all API calls
- All user-specific data (likes, portfolio, DM read status) keyed by this UUID
- Users start with a fixed amount of simulated cash (e.g., $100,000)

## Data Flow

1. **QStash schedule** hits `/api/workflow` every N seconds
2. **Workflow** picks a random seed event from the registry
3. Seed event handler runs in workflow steps, producing tweets/news/DMs/price changes
4. Handler returns a list of follow-up events (name + metadata)
5. Workflow executes follow-up handlers in parallel
6. Recurse until no more follow-up events are returned
7. Frontend polls for new data via TanStack Query (tweets every 5s, prices every 3s, news every 15s)

## Key Design Principles

- **Template-first**: All content (tweets, news, DMs) generated from templates with slot-filling. Interfaces are simple so LLM generation can be swapped in later.
- **Event-driven**: Everything that happens in the simulation is an event. Events have Zod schemas, handlers, and produce follow-up events.
- **Interface-separated**: Frontend and backend communicate through clean REST interfaces. Backend modules (tweets, news, market, portfolio, DMs) each have their own interface.
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
│   │       ├── portfolio/route.ts
│   │       ├── dms/route.ts
│   │       ├── workflow/route.ts
│   │       └── schedule/route.ts
│   ├── lib/
│   │   ├── redis.ts
│   │   ├── interfaces/
│   │   │   ├── tweets.ts
│   │   │   ├── news.ts
│   │   │   ├── market.ts
│   │   │   ├── portfolio.ts
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
│   │   ├── portfolio.ts
│   │   └── dms.ts
│   ├── hooks/
│   │   ├── use-tweets.ts
│   │   ├── use-news.ts
│   │   ├── use-market.ts
│   │   ├── use-portfolio.ts
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
| `06-PORTFOLIO.md` | User portfolio, buy/sell, cash management |
| `07-FRONTEND.md` | UI layout, stores, hooks, components, polling |
| `08-EVENT-CHAINS.md` | All creative event chain definitions |
| `09-MILESTONES.md` | Implementation plan broken into milestones |
