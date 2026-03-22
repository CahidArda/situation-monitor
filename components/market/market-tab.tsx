"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useMarketPrices } from "@/hooks/use-market";
import { useMarketStore } from "@/stores/market";
import { GlobalIndexBar } from "./global-index-bar";
import { SectorRow } from "./sector-row";
import { CommodityRow } from "./commodity-row";
import { CompanyTable } from "./company-table";
import { CompanyDetail } from "./company-detail";

export function MarketTab() {
  const { data, isLoading } = useMarketPrices();
  const setPrices = useMarketStore((s) => s.setPrices);
  const companies = useMarketStore((s) => s.companies);
  const commodities = useMarketStore((s) => s.commodities);
  const sectors = useMarketStore((s) => s.sectors);
  const globalIndex = useMarketStore((s) => s.globalIndex);
  const selectedCompanyId = useMarketStore((s) => s.selectedCompanyId);
  const selectedSectorId = useMarketStore((s) => s.selectedSectorId);
  const selectCompany = useMarketStore((s) => s.selectCompany);

  useEffect(() => {
    if (data) setPrices(data);
  }, [data, setPrices]);

  // Company detail view
  if (selectedCompanyId) {
    const company = companies.find((c) => c.id === selectedCompanyId);
    if (company) {
      return (
        <CompanyDetail
          company={company}
          onBack={() => selectCompany(null)}
        />
      );
    }
  }

  if (isLoading && companies.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Filter companies by selected sector
  const filteredCompanies = selectedSectorId
    ? companies.filter((c) => c.sectors.some((s) => s.sectorId === selectedSectorId))
    : companies;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <GlobalIndexBar
        value={globalIndex.value}
        change={globalIndex.change}
        changePercent={globalIndex.changePercent}
      />
      <SectorRow sectors={sectors} />
      <CommodityRow commodities={commodities} />
      <CompanyTable companies={filteredCompanies} />
    </div>
  );
}
