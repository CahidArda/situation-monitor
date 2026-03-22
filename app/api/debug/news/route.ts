import { NextResponse } from "next/server";
import { news } from "@/lib/news";
import { getNewsIndex } from "@/lib/search";
import { COMPANIES } from "@/lib/market/companies";
import { SECTORS } from "@/lib/market/sectors";
import { getPersonasByType } from "@/lib/simulation/personas";
import {
  pickRandom,
  SCANDAL_REASONS,
  ANALYST_FIRMS,
  RIDICULOUS_PRODUCTS,
} from "@/lib/simulation/world";
import { randomName } from "@/lib/simulation/names";
import { generateNewsArticle, type NewsEventType } from "@/lib/events/templates/news";
import type { ContentEntity } from "@/lib/interfaces/types";

function extractEntities(params: Record<string, string>): ContentEntity[] {
  const entities: ContentEntity[] = [];
  if (params.company) entities.push({ text: params.company, type: "company" });
  if (params.ticker) entities.push({ text: params.ticker, type: "ticker" });
  if (params.sector) entities.push({ text: params.sector, type: "sector" });
  if (params.ceoName) entities.push({ text: params.ceoName, type: "person" });
  if (params.personName) entities.push({ text: params.personName, type: "person" });
  if (params.interimCeo) entities.push({ text: params.interimCeo, type: "person" });
  if (params.country1) entities.push({ text: params.country1, type: "sector" });
  if (params.country2) entities.push({ text: params.country2, type: "sector" });
  if (params.product) entities.push({ text: params.product, type: "commodity" });
  if (params.analystName) entities.push({ text: params.analystName, type: "person" });
  if (params.firmName) entities.push({ text: params.firmName, type: "company" });
  if (params.majorCompanies) {
    for (const name of params.majorCompanies.split(", ")) {
      if (name) entities.push({ text: name, type: "company" });
    }
  }
  return entities;
}

const GENERATORS: Record<NewsEventType, () => Parameters<typeof generateNewsArticle>[1]> = {
  "ceo-resignation": () => {
    const company = pickRandom(COMPANIES);
    const scandal = pickRandom(SCANDAL_REASONS);
    return {
      company: company.name,
      ticker: company.ticker,
      ceoName: company.ceoName,
      sector: company.sectors[0]?.sectorId ?? "business",
      city: company.headquarters.city,
      country: company.headquarters.country,
      scandalDetail: scandal.detail,
      boardReaction: "deeply concerning and frankly embarrassing",
      yearAppointed: String(2018 + Math.floor(Math.random() * 5)),
      ceoStatement: "I regret nothing. Well, maybe the iguana thing.",
      interimCeo: randomName(),
      analystReaction: "are cautiously optimistic about new leadership",
      direction: Math.random() > 0.5 ? "up" : "down",
      percent: (Math.random() * 8 + 1).toFixed(1),
      price: (company.baseValue * (1 + (Math.random() - 0.5) * 0.1)).toFixed(2),
    };
  },
  "sector-report": () => {
    const sector = pickRandom(SECTORS);
    const companies = COMPANIES.filter((c) =>
      c.sectors.some((s) => s.sectorId === sector.id),
    );
    const direction = Math.random() > 0.5 ? "up" : "down";
    return {
      sector: sector.name,
      direction,
      percent: (Math.random() * 5 + 1).toFixed(1),
      reason: "shifting regulatory landscape and investor sentiment",
      majorCompanies: companies.slice(0, 3).map((c) => c.name).join(", ") || "various firms",
      catalyst: "a combination of macro trends and sector-specific developments",
      analystQuote: direction === "up"
        ? "We're seeing a structural shift that could persist for quarters"
        : "This is a correction we've been warning about for weeks",
      analystName: randomName(),
      firmName: pickRandom(ANALYST_FIRMS),
      globalDirection: direction,
      globalPercent: (Math.random() * 2 + 0.1).toFixed(1),
    };
  },
  "diplomatic-incident": () => ({
    country1: "Norway",
    country2: "Japan",
    city: "Oslo",
    issue: "fishing rights",
    incident: "a Norwegian fishing vessel entered disputed Japanese waters",
    official1Name: randomName(),
    official1Title: "Minister of Foreign Affairs",
    official2Name: randomName(),
    quote1: "completely unacceptable and frankly fishy",
    quote2: "a gross overreaction to a minor navigational error",
    issueDetail: "overlapping exclusive economic zones in the North Pacific",
    previousIncident: "the 2023 herring tariff dispute",
    affectedSectors: "Agriculture and Shipping",
    mainIndex: "Global",
    indexDirection: "down",
    indexPercent: (Math.random() * 2 + 0.3).toFixed(1),
  }),
  "arrest": () => {
    const company = pickRandom(COMPANIES);
    return {
      personName: company.ceoName,
      role: "executive",
      city: company.headquarters.city,
      country: company.headquarters.country,
      charges: "market manipulation",
      knownFor: `leading ${company.name}`,
      authority: "the Securities & Exchange Commission",
      investigation: "a six-month probe into unusual trading patterns",
      lawyerName: randomName(),
      lawyerQuote: "will be fully exonerated once all facts come to light",
      significance: `its potential impact on ${company.ticker} share price`,
      additionalContext: `${company.name} shares reacted immediately to the news.`,
    };
  },
  "product-launch": () => {
    const company = pickRandom(COMPANIES);
    const product = pickRandom(RIDICULOUS_PRODUCTS);
    return {
      company: company.name,
      ticker: company.ticker,
      product,
      direction: Math.random() > 0.4 ? "up" : "down",
      percent: (Math.random() * 5 + 1).toFixed(1),
      analystReaction: `"We're still trying to figure out if this is serious," said ${randomName()} of ${pickRandom(ANALYST_FIRMS)}.`,
    };
  },
  "market-crash": () => {
    const sector = pickRandom(SECTORS);
    const companies = COMPANIES.filter((c) =>
      c.sectors.some((s) => s.sectorId === sector.id),
    );
    return {
      sector: sector.name,
      percent: (Math.random() * 10 + 3).toFixed(1),
      reason: "a combination of profit-taking and geopolitical uncertainty",
      affectedCompanies: companies.slice(0, 3).map((c) => c.name).join(", ") || "multiple firms",
      analystName: randomName(),
      analystQuote: "This is exactly the kind of situation one should be monitoring",
    };
  },
};

export async function POST() {
  const eventTypes = Object.keys(GENERATORS) as NewsEventType[];
  const eventType = pickRandom(eventTypes);
  const params = GENERATORS[eventType]();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const generated = generateNewsArticle(eventType, params as any);

  const newsOrgs = getPersonasByType("news");
  const source = pickRandom(newsOrgs);

  const article = await news.write({
    headline: generated.headline,
    summary: generated.summary,
    body: generated.body,
    category: generated.category,
    source: source.id,
    sourceDisplayName: source.displayName,
    entities: extractEntities(params as Record<string, string>),
  });

  await getNewsIndex().waitIndexing();

  return NextResponse.json({ article, eventType });
}
