// ---------------------------------------------------------------------------
// Shared types used across multiple interfaces
// ---------------------------------------------------------------------------

/** A simulated persona (fake twitter account) */
export interface Persona {
  id: string;
  handle: string;
  displayName: string;
  type: PersonaType;
  bio: string;
  traits: string[];
  sectors?: string[];
}

export type PersonaType =
  | "regular"
  | "news"
  | "analyst"
  | "shitposter"
  | "insider"
  | "official";

/** A simulated tweet */
export type Tweet = {
  id: string;
  authorId: string;
  authorHandle: string;
  authorDisplayName: string;
  content: string;
  timestamp: number;
  likes: number;
  newsLink?: { newsId: string; headline: string };
  eventChainId?: string;
  metadata?: Record<string, string>;
}

/** A news article produced by the simulation */
export type NewsArticle = {
  id: string;
  headline: string;
  summary: string;
  body: string;
  source: string;
  sourceDisplayName: string;
  category: NewsCategory;
  timestamp: number;
  relatedCompanies?: string[];
  relatedSectors?: string[];
  eventChainId?: string;
  metadata?: Record<string, string>;
}

export type NewsCategory =
  | "business"
  | "politics"
  | "world"
  | "markets"
  | "opinion"
  | "breaking";

/** A direct message from a persona */
export type DirectMessage = {
  id: string;
  fromPersonaId: string;
  fromHandle: string;
  fromDisplayName: string;
  content: string;
  timestamp: number;
  type: DMType;
  metadata?: DMMetadata;
}

export type DMType = "tip" | "followup" | "brag" | "panic" | "casual";

export type DMMetadata = {
  eventChainId?: string;
  relatedCompany?: string;
  relatedSector?: string;
  tipAccuracy?: "correct" | "incorrect" | "unknown";
}

/** Conversation summary for inbox view */
export interface DMConversation {
  personaId: string;
  personaHandle: string;
  personaDisplayName: string;
  lastMessage: string;
  lastTimestamp: number;
}

/** A stock market sector */
export interface Sector {
  id: string;
  name: string;
  description: string;
  baseVolatility: number;
}

export type SectorStatus = "bull" | "bear" | "volatile" | "stable";

/** Dynamic sector state stored in Redis hash sim:sector:{id} */
export interface SectorState {
  status: SectorStatus;
  indexValue: number;
}

/** A company in the simulated market */
export interface Company {
  id: string;
  name: string;
  ticker: string;
  description: string;
  ceoName: string;
  headquarters: { city: string; country: string };
  sectors: Array<{ sectorId: string; weight: number }>;
  baseValue: number;
  volatilityMultiplier: number;
  founded: string;
  employees: number;
  funFact: string;
}

/** A tradeable commodity */
export interface Commodity {
  id: string;
  name: string;
  ticker: string;
  unit: string;
  sectorId: string;
  basePrice: number;
  volatilityMultiplier: number;
}

// ---------------------------------------------------------------------------
// Client-side only types (portfolio lives in localStorage)
// ---------------------------------------------------------------------------

export interface PortfolioHolding {
  assetId: string;
  assetType: "stock" | "commodity";
  ticker: string;
  name: string;
  quantity: number;
  avgBuyPrice: number;
}

export interface Transaction {
  id: string;
  assetId: string;
  assetType: "stock" | "commodity";
  ticker: string;
  action: "buy" | "sell";
  quantity: number;
  pricePerUnit: number;
  totalAmount: number;
  timestamp: number;
}

export interface ComputedHolding extends PortfolioHolding {
  currentPrice: number;
  totalValue: number;
  pnl: number;
  pnlPercent: number;
}

export interface ComputedPortfolio {
  cash: number;
  holdings: ComputedHolding[];
  totalValue: number;
  totalPnl: number;
}
