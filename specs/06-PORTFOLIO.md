# 06 — Portfolio Spec

## Overview

Each user starts with simulated cash and can buy/sell company stocks and commodities. The portfolio tab shows holdings, current values, P&L, and transaction history.

## Data Model

```typescript
interface PortfolioHolding {
  assetId: string;          // company or commodity ID
  assetType: "stock" | "commodity";
  ticker: string;
  name: string;
  quantity: number;
  avgBuyPrice: number;      // average price at purchase
  currentPrice: number;     // filled in at read time
  totalValue: number;       // quantity * currentPrice
  pnl: number;              // totalValue - (quantity * avgBuyPrice)
  pnlPercent: number;
}

interface Portfolio {
  userId: string;
  cash: number;
  holdings: PortfolioHolding[];
  totalValue: number;       // cash + sum of all holding values
  totalPnl: number;
}

interface Transaction {
  id: string;
  userId: string;
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

## Redis Schema

```
portfolio:{userId}:cash                → number (starting: 100000)
portfolio:{userId}:holding:{assetId}   → JSON { quantity, avgBuyPrice, assetType, ticker, name }
portfolio:{userId}:holdings            → Set of asset IDs
portfolio:{userId}:transactions        → Sorted Set (score = timestamp, member = txn ID)
portfolio:{userId}:txn:{txnId}         → JSON of Transaction
```

## Backend Interface

```typescript
// lib/interfaces/portfolio.ts

interface PortfolioInterface {
  // Get full portfolio state
  getPortfolio(userId: string): Promise<Portfolio>;

  // Buy an asset
  buy(params: {
    userId: string;
    assetId: string;
    assetType: "stock" | "commodity";
    quantity: number;
  }): Promise<{ transaction: Transaction; newCash: number }>;

  // Sell an asset
  sell(params: {
    userId: string;
    assetId: string;
    quantity: number;
  }): Promise<{ transaction: Transaction; newCash: number }>;

  // Get transaction history
  getTransactions(
    userId: string,
    params?: { limit?: number; beforeTs?: number }
  ): Promise<{ transactions: Transaction[]; hasMore: boolean }>;

  // Initialize portfolio for new user (if not exists)
  initializeIfNew(userId: string): Promise<void>;
}
```

### Buy Logic

1. Look up current price of the asset
2. Calculate total cost = quantity × currentPrice
3. Check user has enough cash
4. If yes:
   - Deduct cash
   - If user already holds this asset: update quantity, recalculate avgBuyPrice
   - If new holding: create holding record
   - Record transaction
5. Return updated state

### Sell Logic

1. Check user holds enough quantity
2. Look up current price
3. Calculate total proceeds = quantity × currentPrice
4. Deduct quantity from holding (remove if 0)
5. Add proceeds to cash
6. Record transaction

### Average Buy Price

When buying more of an existing holding:
```
newAvgPrice = (oldQuantity * oldAvgPrice + newQuantity * newPrice) / (oldQuantity + newQuantity)
```

## API Routes

### `GET /api/portfolio`
Headers: `x-user-id`
Returns: `Portfolio`

### `POST /api/portfolio/buy`
Headers: `x-user-id`
Body: `{ assetId: string, assetType: "stock" | "commodity", quantity: number }`
Returns: `{ transaction: Transaction, newCash: number }`

### `POST /api/portfolio/sell`
Headers: `x-user-id`
Body: `{ assetId: string, quantity: number }`
Returns: `{ transaction: Transaction, newCash: number }`

### `GET /api/portfolio/transactions`
Headers: `x-user-id`
Query params: `limit`, `beforeTs`
Returns: `{ transactions: Transaction[], hasMore: boolean }`

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
4. Portfolio value updates as market prices change (via polling)
