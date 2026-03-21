import type {
  Company,
  Commodity,
  Sector,
  SectorState,
  SectorStatus,
} from "./types";

export interface CompanyWithPrice extends Company {
  currentPrice: number;
  change: number;
  changePercent: number;
}

export interface CommodityWithPrice extends Commodity {
  currentPrice: number;
  change: number;
  changePercent: number;
}

export interface SectorWithState extends Sector, SectorState {}

export interface MarketInterface {
  /** Get all current prices (for the market overview). */
  getPrices(): Promise<{
    companies: CompanyWithPrice[];
    commodities: CommodityWithPrice[];
    sectors: SectorWithState[];
    globalIndex: { value: number; change: number; changePercent: number };
  }>;

  /** Get price history for sparklines. */
  getPriceHistory(params: {
    type: "company" | "sector" | "commodity" | "global";
    id: string;
    lastN?: number;
  }): Promise<Array<{ tick: number; price: number }>>;

  /** Get a single company with its current price. */
  getCompany(
    companyId: string,
  ): Promise<(Company & { currentPrice: number }) | null>;

  // --- Write methods (for event handlers) ---

  /** Update sector index value. */
  updateSectorIndex(sectorId: string, newValue: number): Promise<void>;

  /** Update sector status. */
  updateSectorStatus(sectorId: string, status: SectorStatus): Promise<void>;

  /** Update company base value. */
  updateCompanyBaseValue(companyId: string, newBaseValue: number): Promise<void>;

  /** Advance the simulation clock, recalculate all prices, store history. */
  tick(): Promise<void>;
}
