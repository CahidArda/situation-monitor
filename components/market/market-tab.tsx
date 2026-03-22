"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useMarketPrices } from "@/hooks/use-market";
import { useMarketStore } from "@/stores/market";
import { COMPANIES } from "@/lib/market/companies";
import { GlobalIndexBar } from "./global-index-bar";
import { SectorRow } from "./sector-row";
import { CompanyTable } from "./company-table";
import { CompanyDetail } from "./company-detail";

export function MarketTab() {
  const searchParams = useSearchParams();
  const { data, isLoading } = useMarketPrices();
  const setPrices = useMarketStore((s) => s.setPrices);
  const companies = useMarketStore((s) => s.companies);
  const commodities = useMarketStore((s) => s.commodities);
  const sectors = useMarketStore((s) => s.sectors);
  const globalIndex = useMarketStore((s) => s.globalIndex);
  const selectedCompanyId = useMarketStore((s) => s.selectedCompanyId);
  const selectedSectorIds = useMarketStore((s) => s.selectedSectorIds);
  const selectCompany = useMarketStore((s) => s.selectCompany);
  const toggleSector = useMarketStore((s) => s.toggleSector);

  useEffect(() => {
    if (data) setPrices(data);
  }, [data, setPrices]);

  // Read query params for deep linking
  const tickerParam = searchParams.get("ticker");
  const sectorParam = searchParams.get("sector");

  useEffect(() => {
    if (tickerParam && companies.length > 0) {
      const company = companies.find((c) => c.ticker === tickerParam) ??
        COMPANIES.find((c) => c.ticker === tickerParam);
      if (company) selectCompany(company.id);
    }
  }, [tickerParam, companies, selectCompany]);

  const sectorInitialized = useRef(false);
  useEffect(() => {
    if (sectorParam && !sectorInitialized.current) {
      sectorInitialized.current = true;
      toggleSector(sectorParam);
    }
  }, [sectorParam, toggleSector]);

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

  // Filter companies by selected sectors
  const filteredCompanies = selectedSectorIds.length > 0
    ? companies.filter((c) =>
        c.sectors.some((s) => selectedSectorIds.includes(s.sectorId)),
      )
    : companies;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <GlobalIndexBar
        value={globalIndex.value}
        change={globalIndex.change}
        changePercent={globalIndex.changePercent}
        commodities={commodities}
      />
      <div className="my-2" />
      <SectorRow sectors={sectors} />
      <CompanyTable companies={filteredCompanies} />
    </div>
  );
}
