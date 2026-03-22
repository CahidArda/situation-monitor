import { NextResponse } from "next/server";
import { tweets } from "@/lib/tweets";
import { PERSONAS } from "@/lib/simulation/personas";
import { COMPANIES } from "@/lib/market/companies";
import { SECTORS } from "@/lib/market/sectors";
import {
  generateTweetContent,
  type TweetEventType,
} from "@/lib/events/templates/tweets";
import { pickRandom, SCANDAL_REASONS } from "@/lib/simulation/world";
import type { ContentEntity } from "@/lib/interfaces/types";
import { getTweetIndex } from "@/lib/search";

/** Build entity list from params for hoverable highlighting */
function extractEntities(params: Record<string, string>): ContentEntity[] {
  const entities: ContentEntity[] = [];
  if (params.company) entities.push({ text: params.company, type: "company" });
  if (params.ticker) entities.push({ text: params.ticker, type: "ticker" });
  if (params.sector) entities.push({ text: params.sector, type: "sector" });
  if (params.ceoName) entities.push({ text: params.ceoName, type: "person" });
  if (params.personName) entities.push({ text: params.personName, type: "person" });
  if (params.country1) entities.push({ text: params.country1, type: "sector" });
  if (params.country2) entities.push({ text: params.country2, type: "sector" });
  if (params.product) entities.push({ text: params.product, type: "commodity" });
  if (params.insiderHandle) entities.push({ text: params.insiderHandle, type: "persona" });
  return entities;
}

const EVENT_GENERATORS: Record<TweetEventType, () => { personaTypes: string[]; params: Record<string, string> }> = {
  "stock-rises": () => {
    const company = pickRandom(COMPANIES);
    return {
      personaTypes: ["analyst", "shitposter", "news", "regular"],
      params: {
        company: company.name,
        ticker: company.ticker,
        percent: (Math.random() * 15 + 1).toFixed(1),
        reason: "strong earnings report",
        price: (company.baseValue * (1 + Math.random() * 0.2)).toFixed(2),
      },
    };
  },
  "stock-falls": () => {
    const company = pickRandom(COMPANIES);
    return {
      personaTypes: ["analyst", "shitposter", "news", "regular"],
      params: {
        company: company.name,
        ticker: company.ticker,
        percent: (Math.random() * 12 + 1).toFixed(1),
        reason: "disappointing guidance",
        price: (company.baseValue * (1 - Math.random() * 0.15)).toFixed(2),
      },
    };
  },
  "ceo-scandal": () => {
    const company = pickRandom(COMPANIES);
    const scandal = pickRandom(SCANDAL_REASONS);
    return {
      personaTypes: ["regular", "shitposter", "analyst", "news"],
      params: {
        company: company.name,
        ceoName: company.ceoName,
        reason: scandal.short,
        price: company.baseValue.toFixed(2),
      },
    };
  },
  "sector-boom": () => {
    const sector = pickRandom(SECTORS);
    return {
      personaTypes: ["analyst", "news", "shitposter"],
      params: {
        sector: sector.name,
        percent: (Math.random() * 8 + 2).toFixed(1),
        reason: "favorable policy changes",
      },
    };
  },
  "sector-crash": () => {
    const sector = pickRandom(SECTORS);
    return {
      personaTypes: ["analyst", "news", "shitposter"],
      params: {
        sector: sector.name,
        percent: (Math.random() * 8 + 2).toFixed(1),
        reason: "regulatory crackdown",
      },
    };
  },
  "noise": () => ({
    personaTypes: ["shitposter", "analyst", "regular", "insider"],
    params: {},
  }),
  "diplomatic-incident": () => ({
    personaTypes: ["news", "analyst", "shitposter", "regular"],
    params: {
      country1: "Norway",
      country2: "Japan",
      issue: "fishing rights",
      sector: "Agriculture",
    },
  }),
  "product-launch": () => {
    const company = pickRandom(COMPANIES);
    return {
      personaTypes: ["news", "analyst", "shitposter", "regular"],
      params: {
        company: company.name,
        product: "AI-powered spoon",
        direction: "up",
        percent: (Math.random() * 5 + 1).toFixed(1),
      },
    };
  },
  "insider-rumor": () => ({
    personaTypes: ["insider", "regular", "analyst"],
    params: { ticker: pickRandom(COMPANIES).ticker },
  }),
  "insider-correct": () => ({
    personaTypes: ["insider", "regular"],
    params: {
      ticker: pickRandom(COMPANIES).ticker,
      insiderHandle: "GoldBugLarry69",
      direction: "up",
    },
  }),
  "insider-wrong": () => ({
    personaTypes: ["insider", "shitposter"],
    params: {
      ticker: pickRandom(COMPANIES).ticker,
      insiderHandle: "GoldBugLarry69",
      direction: "up",
    },
  }),
  "arrest": () => {
    const company = pickRandom(COMPANIES);
    return {
      personaTypes: ["news", "shitposter", "regular"],
      params: {
        personName: company.ceoName,
        charges: "market manipulation",
        company: company.name,
        ticker: company.ticker,
      },
    };
  },
};

export async function POST() {
  const eventTypes = Object.keys(EVENT_GENERATORS) as TweetEventType[];
  const eventType = pickRandom(eventTypes);
  const { personaTypes, params } = EVENT_GENERATORS[eventType]();
  const personaType = pickRandom(personaTypes);

  // Find a matching persona
  const matchingPersonas = PERSONAS.filter((p) => p.type === personaType);
  const persona = matchingPersonas.length > 0
    ? pickRandom(matchingPersonas)
    : pickRandom(PERSONAS);

  const content = generateTweetContent(
    eventType,
    persona.type,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    params as any,
  );

  const tweet = await tweets.write({
    authorId: persona.id,
    authorHandle: persona.handle,
    authorDisplayName: persona.displayName,
    content,
    entities: extractEntities(params),
  });

  await getTweetIndex().waitIndexing()

  return NextResponse.json({ tweet, eventType, personaType: persona.type });
}
