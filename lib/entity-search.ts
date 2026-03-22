import { COMPANIES } from "@/lib/market/companies";
import { COMMODITIES } from "@/lib/market/commodities";

/**
 * Given a search term, return all related terms for $or matching.
 * E.g., "PVLT" → ["PVLT", "PetroVolt Energy"]
 * E.g., "PetroVolt Energy" → ["PetroVolt Energy", "PVLT"]
 */
export function expandSearchTerms(search: string): string[] {
  const terms = new Set<string>();
  terms.add(search);

  // Check if it's a ticker → add company/commodity name
  const companyByTicker = COMPANIES.find((c) => c.ticker === search);
  if (companyByTicker) terms.add(companyByTicker.name);

  const commodityByTicker = COMMODITIES.find((c) => c.ticker === search);
  if (commodityByTicker) terms.add(commodityByTicker.name);

  // Check if it's a company name → add ticker
  const companyByName = COMPANIES.find((c) => c.name === search);
  if (companyByName) terms.add(companyByName.ticker);

  // Check if it's a commodity name → add ticker
  const commodityByName = COMMODITIES.find((c) => c.name === search);
  if (commodityByName) terms.add(commodityByName.ticker);

  return [...terms];
}

/**
 * Build a filter clause that searches content for any of the expanded terms.
 * Returns a single $smart filter or an $or with multiple $smart filters.
 */
export function buildContentSearchFilter(
  search: string,
  field: string = "content",
): Record<string, unknown> {
  const terms = expandSearchTerms(search);
  if (terms.length === 1) {
    return { [field]: { $eq: terms[0] } };
  }
  return {
    $or: terms.map((t) => ({ [field]: { $eq: t } })),
  };
}
