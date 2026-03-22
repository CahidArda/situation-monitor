import type { WorkflowContext } from "@upstash/workflow";
import { market } from "./market";
import { getSectorIndex } from "@/lib/events/state";
import { COMPANIES } from "./companies";
import { ticksToSeconds } from "@/lib/constants";
import type { SectorStatus } from "@/lib/interfaces/types";

/**
 * Apply a market impact: change a sector's index by a percentage and set its status.
 * Then sleep 1 tick so the change propagates before news/tweets reference it.
 *
 * @param percentChange - positive for boom, negative for crash (e.g. 15 or -10)
 * @param status - new sector status
 */
export async function applyMarketImpact(
  ctx: WorkflowContext,
  sectorId: string,
  percentChange: number,
  status: SectorStatus,
  stepName = "market-impact",
) {
  await ctx.run(stepName, async () => {
    const currentIndex = await getSectorIndex(sectorId);
    await market.updateSectorIndex(sectorId, currentIndex * (1 + percentChange / 100));
    await market.updateSectorStatus(sectorId, status);
  });
  await ctx.sleep(`${stepName}-settle`, ticksToSeconds(1));
}

/**
 * Look up a company's primary sector ID.
 */
export function getCompanySectorId(companyId: string): string | null {
  const company = COMPANIES.find((c) => c.id === companyId);
  if (!company || company.sectors.length === 0) return null;
  return company.sectors[0].sectorId;
}

/**
 * Look up a company's primary sector ID by company name.
 */
export function getCompanySectorIdByName(companyName: string): string | null {
  const company = COMPANIES.find((c) => c.name === companyName);
  if (!company || company.sectors.length === 0) return null;
  return company.sectors[0].sectorId;
}
