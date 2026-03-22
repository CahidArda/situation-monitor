import { create } from "zustand";
import type { CompanyWithPrice, CommodityWithPrice, SectorWithState } from "@/lib/interfaces/market";

type MarketStore = {
  companies: CompanyWithPrice[];
  commodities: CommodityWithPrice[];
  sectors: SectorWithState[];
  globalIndex: { value: number; change: number; changePercent: number };
  selectedCompanyId: string | null;
  selectedSectorId: string | null;

  setPrices: (data: {
    companies: CompanyWithPrice[];
    commodities: CommodityWithPrice[];
    sectors: SectorWithState[];
    globalIndex: { value: number; change: number; changePercent: number };
  }) => void;
  selectCompany: (id: string | null) => void;
  selectSector: (id: string | null) => void;
};

export const useMarketStore = create<MarketStore>()((set) => ({
  companies: [],
  commodities: [],
  sectors: [],
  globalIndex: { value: 100, change: 0, changePercent: 0 },
  selectedCompanyId: null,
  selectedSectorId: null,

  setPrices: (data) => set(data),
  selectCompany: (id) => set({ selectedCompanyId: id }),
  selectSector: (id) => set({ selectedSectorId: id }),
}));
