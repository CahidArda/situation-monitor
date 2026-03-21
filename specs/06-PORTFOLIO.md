# 06 — Portfolio Spec

## Overview

Each user starts with simulated cash and can buy/sell company stocks and commodities. The portfolio is **entirely client-side** — all holdings, cash, and transaction history are stored in localStorage and managed via Zustand. Market prices come from the backend API.

## Data Model

```typescript
interface PortfolioHolding {
  assetId: string;          // company or commodity ID
  assetType: "stock" | "commodity";
  ticker: string;
  name: string;
  quantity: number;
  avgBuyPrice: number;      // average price at purchase
}

interface Transaction {
  id: string;               // nanoid
  assetId: string;
  assetType: "stock" | "commodity";
  ticker: string;
  action: "buy" | "sell";
  quantity: number;
  pricePerUnit: number;
  totalAmount: number;
  timestamp: number;
}
```

## localStorage Schema

```
mts:portfolio:cash         → number (starting: 100000)
mts:portfolio:holdings     → JSON array of PortfolioHolding
mts:portfolio:transactions → JSON array of Transaction
```

All portfolio data is persisted via Zustand's `persist` middleware with localStorage as the storage backend.

## Client-Side Logic

### Buy Logic

1. Look up current price of the asset from market store (fetched from `/api/market`)
2. Calculate total cost = quantity × currentPrice
3. Check user has enough cash
4. If yes:
   - Deduct cash
   - If user already holds this asset: update quantity, recalculate avgBuyPrice
   - If new holding: add holding record
   - Record transaction
5. Persist to localStorage

### Sell Logic

1. Check user holds enough quantity
2. Look up current price from market store
3. Calculate total proceeds = quantity × currentPrice
4. Deduct quantity from holding (remove if 0)
5. Add proceeds to cash
6. Record transaction

### Average Buy Price

When buying more of an existing holding:
```
newAvgPrice = (oldQuantity * oldAvgPrice + newQuantity * newPrice) / (oldQuantity + newQuantity)
```

### Computed Values (derived at render time)

```typescript
interface ComputedHolding extends PortfolioHolding {
  currentPrice: number;     // from market store
  totalValue: number;       // quantity * currentPrice
  pnl: number;              // totalValue - (quantity * avgBuyPrice)
  pnlPercent: number;
}

interface ComputedPortfolio {
  cash: number;
  holdings: ComputedHolding[];
  totalValue: number;       // cash + sum of all holding values
  totalPnl: number;
}
```

## API Routes

None — portfolio is entirely client-side. Market prices are provided by `GET /api/market`.

## Frontend Behavior

1. Portfolio tab shows:
   - Cash balance at top
   - Total portfolio value with total P&L
   - Holdings table: asset, quantity, avg buy price, current price, value, P&L, P&L %
   - Sell button on each holding
2. Buy flow:
   - Available from the Market tab when viewing a company/commodity
   - Quantity input + "Buy" button
   - Shows estimated cost and remaining cash
3. Transaction history: collapsible section at bottom of portfolio tab
4. Portfolio values update as market prices change (via polling from market store)
5. On first visit, portfolio is initialized with $100,000 cash and no holdings
