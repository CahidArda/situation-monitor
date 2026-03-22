import { create } from "zustand";
import type { CompanyWithPrice, CommodityWithPrice, SectorWithState } from "@/lib/interfaces/market";

type MarketStore = {
  companies: CompanyWithPrice[];
  commodities: CommodityWithPrice[];
  sectors: SectorWithState[];
  globalIndex: { value: number; change: number; changePercent: number };
  selectedCompanyId: string | null;
  selectedSectorIds: string[];

  setPrices: (data: {
    companies: CompanyWithPrice[];
    commodities: CommodityWithPrice[];
    sectors: SectorWithState[];
    globalIndex: { value: number; change: number; changePercent: number };
  }) => void;
  selectCompany: (id: string | null) => void;
  toggleSector: (id: string) => void;
};

export const useMarketStore = create<MarketStore>()((set) => ({
  companies: [],
  commodities: [],
  sectors: [],
  globalIndex: { value: 100, change: 0, changePercent: 0 },
  selectedCompanyId: null,
  selectedSectorIds: [],

  setPrices: (data) => set(data),
  selectCompany: (id) => set({ selectedCompanyId: id }),
  toggleSector: (id) =>
    set((state) => {
      const ids = new Set(state.selectedSectorIds);
      if (ids.has(id)) ids.delete(id);
      else ids.add(id);
      return { selectedSectorIds: [...ids] };
    }),
}));
