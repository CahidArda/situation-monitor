import { NextResponse } from "next/server";
import { dms } from "@/lib/dms";
import { getDMIndex } from "@/lib/search";
import { DM_PERSONAS } from "@/lib/simulation/personas";
import { COMPANIES } from "@/lib/market/companies";
import { SECTORS } from "@/lib/market/sectors";
import { pickRandom } from "@/lib/simulation/world";
import { generateDMContent } from "@/lib/events/templates/dms";
import type { DMType } from "@/lib/interfaces/types";

const DM_TYPES: DMType[] = ["tip", "followup", "brag", "panic", "casual"];

export async function POST() {
  const personaIds = Object.keys(DM_PERSONAS);
  const personaId = pickRandom(personaIds);
  const dmType = pickRandom(DM_TYPES);
  const company = pickRandom(COMPANIES);
  const sector = pickRandom(SECTORS);

  const content = generateDMContent(
    Math.random() > 0.3 ? "insider-trading" : "general",
    dmType,
    {
      company: company.name,
      ticker: company.ticker,
      prediction: Math.random() > 0.5 ? "moon" : "tank",
      direction: Math.random() > 0.5 ? "up" : "down",
      department: "finance",
      percent: (Math.random() * 15 + 2).toFixed(0),
      amount: `$${(Math.random() * 50000 + 1000).toFixed(0)}`,
      sector: sector.name,
    },
  );

  const dm = await dms.send({
    fromPersonaId: personaId,
    content,
    type: dmType,
  });

  await getDMIndex().waitIndexing();

  return NextResponse.json({ dm, personaId, dmType });
}
