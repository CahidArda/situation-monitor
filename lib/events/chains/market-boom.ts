import { nanoid } from "nanoid";
import type { SeedEventDefinition } from "@/lib/interfaces/events";
import { addActiveChain, removeActiveChain, getActiveChainCount } from "../state";
import { tweets } from "@/lib/tweets";
import { news } from "@/lib/news";
import { dms } from "@/lib/dms";
import { SECTORS } from "@/lib/market/sectors";
import { applyMarketImpact } from "@/lib/market/impact";
import { DM_PERSONAS, getPersonasByType } from "@/lib/simulation/personas";
import { pickRandom } from "@/lib/simulation/world";
import { randomName } from "@/lib/simulation/names";
import { ticksToSeconds, COOLDOWN_TICKS } from "@/lib/constants";
import type { ContentEntity } from "@/lib/interfaces/types";

type SectorId = typeof SECTORS[number]["id"];

type BoomReason = {
  headline: string;
  detail: string;
  sector: SectorId;
};

// Every sector must have at least one boom reason
const BOOM_REASONS: BoomReason[] = [
  // energy
  { headline: "Breakthrough Fusion Energy Achieved", detail: "Scientists confirmed sustained fusion energy output, promising nearly unlimited cheap power", sector: "energy" },
  // tech
  { headline: "AI Declares All Stocks Undervalued", detail: 'A widely-followed AI model declared that "every stock on the market is fundamentally undervalued by at least 30%"', sector: "tech" },
  // agriculture
  { headline: "Fish Population Explosion Reported", detail: "Marine biologists discovered fish populations have tripled in the Atlantic, defying all models", sector: "agriculture" },
  // defense
  { headline: "Global Peace Dividend Declared", detail: "Every major nation simultaneously announced defense budget surpluses, redirecting funds into military R&D grants", sector: "defense" },
  // finance
  { headline: "Collective Manifestation Rally Goes Viral", detail: "Millions of retail investors simultaneously decided that stocks should simply be worth more", sector: "finance" },
  { headline: "Universal Basic Dividends Announced", detail: "A coalition of nations announced a radical plan to distribute corporate profits directly to citizens", sector: "finance" },
  // luxury
  { headline: "Sunken Luxury Cargo Ship Found Intact", detail: "A cargo ship carrying billions in luxury goods, lost 50 years ago, was found perfectly preserved on the ocean floor", sector: "luxury" },
  // mining
  { headline: "Ancient Treasure Discovered", detail: "A construction crew discovered a vast hoard of gold coins beneath a parking lot", sector: "mining" },
  { headline: "New Continent Discovered (Rich in Resources)", detail: "Satellite imagery revealed a previously uncharted landmass in the South Pacific, rich in rare earth minerals", sector: "mining" },
  // shipping
  { headline: "Suez Canal Expansion Completed Early", detail: "The Suez Canal expansion finished 3 years ahead of schedule, doubling global shipping capacity overnight", sector: "shipping" },
  // entertainment
  { headline: "World's First Holographic Theme Park Opens", detail: "A revolutionary holographic theme park opened to 10 million pre-orders on day one, crashing the ticketing system", sector: "entertainment" },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChainMeta {
  chainId: string;
  reason: string;
  detail: string;
  sectorId: string;
  sectorName: string;
  boomPercent: number;
}

// ---------------------------------------------------------------------------
// Chain
// ---------------------------------------------------------------------------

export const marketBoom: SeedEventDefinition = {
  name: "market-boom.setup",
  description: "Start a market boom event",
  weight: 3,
  cooldownTicks: COOLDOWN_TICKS["market-boom"],
  requiredConditions: async () => (await getActiveChainCount()) < 3,
  handler: async (ctx) => {
    // ── Step 1: Setup metadata ──────────────────────────────────────────
    const meta = await ctx.run("setup-meta", async () => {
      const boom = pickRandom(BOOM_REASONS);
      const sector = SECTORS.find((s) => s.id === boom.sector) ?? pickRandom(SECTORS);
      const chainId = `boom-${nanoid(6)}`;
      await addActiveChain(chainId);
      return {
        chainId,
        reason: boom.headline,
        detail: boom.detail,
        sectorId: sector.id,
        sectorName: sector.name,
        boomPercent: 10 + Math.floor(Math.random() * 15), // 10-25%
      } satisfies ChainMeta;
    });

    // ── Step 2: Market impact + breaking news ───────────────────────────
    const entities: ContentEntity[] = [
      { text: meta.sectorName, type: "sector" },
    ];

    // Apply the boom to the sector (includes 1-tick sleep)
    await applyMarketImpact(ctx, meta.sectorId, meta.boomPercent, "bull");

    // Write news first for newsLink
    const headline = `${meta.reason}: ${meta.sectorName} Sector to Benefit Most`;
    const article = await ctx.run("boom-news", async () => {
      const newsPersonas = getPersonasByType("news");
      if (newsPersonas.length === 0) return null;
      const org = pickRandom(newsPersonas);
      const analystName = randomName();
      return news.write({
        headline,
        summary: `${meta.detail}. The ${meta.sectorName} sector surged ${meta.boomPercent}% on the news.`,
        body: `In an extraordinary development, ${meta.detail.toLowerCase()}.\n\nThe ${meta.sectorName} sector immediately surged ${meta.boomPercent}%, with related stocks seeing massive gains.\n\n"This changes everything," said ${analystName}. "We are revising all our models upward."\n\nAnalysts caution that while the news is genuine, the market reaction may be overblown. Others disagree, calling it "the beginning of a new era."`,
        category: "breaking",
        source: org.id,
        sourceDisplayName: org.displayName,
        entities: [...entities, { text: analystName, type: "person" as const }],
      });
    });

    // News tweet
    await ctx.run("news-tweet", async () => {
      const newsPersonas = getPersonasByType("news");
      if (newsPersonas.length === 0) return;
      const persona = pickRandom(newsPersonas);
      await tweets.write({
        authorId: persona.id,
        authorHandle: persona.handle,
        authorDisplayName: persona.displayName,
        content: `BREAKING: ${meta.reason}. ${meta.sectorName} sector up ${meta.boomPercent}%. Markets euphoric.`,
        eventChainId: meta.chainId,
        entities,
        newsLink: article ? { newsId: article.id, headline } : undefined,
      });
    });

    const delay1 = await ctx.run("delay-1", () => 2 + Math.floor(Math.random() * 2));
    await ctx.sleep("after-breaking-news", ticksToSeconds(delay1));

    // ── Step 3: Euphoria wave ───────────────────────────────────────────
    await ctx.run("shitposter-tweet", async () => {
      const shitposters = getPersonasByType("shitposter");
      if (shitposters.length === 0) return;
      const persona = pickRandom(shitposters);
      const reactions = [
        `${meta.sectorName} UP ${meta.boomPercent}%?!? I'M LITERALLY CRYING. MY PORTFOLIO IS SAVED. 😭🚀🚀`,
        `EVERYONE WHO DOUBTED ${meta.sectorName} CAN APOLOGIZE NOW. I'll be on my yacht. 🛥️`,
        `${meta.reason}?? WE LIVE IN THE BEST TIMELINE. ${meta.sectorName} TO THE MOON 🚀🚀🚀`,
      ];
      await tweets.write({
        authorId: persona.id,
        authorHandle: persona.handle,
        authorDisplayName: persona.displayName,
        content: pickRandom(reactions),
        eventChainId: meta.chainId,
        entities,
      });
    });

    await ctx.run("analyst-tweet", async () => {
      const analysts = getPersonasByType("analyst");
      if (analysts.length === 0) return;
      const persona = pickRandom(analysts);
      const reactions = [
        `${meta.sectorName} +${meta.boomPercent}% is just the beginning. Raising all price targets. This is a paradigm shift.`,
        `I've been bullish on ${meta.sectorName} for months. Today validates the thesis. Thread incoming.`,
      ];
      await tweets.write({
        authorId: persona.id,
        authorHandle: persona.handle,
        authorDisplayName: persona.displayName,
        content: pickRandom(reactions),
        eventChainId: meta.chainId,
        entities,
      });
    });

    await ctx.run("insider-dm", async () => {
      const insiderIds = Object.keys(DM_PERSONAS);
      const insiderId = pickRandom(insiderIds);
      await dms.send({
        fromPersonaId: insiderId,
        content: `I TOLD you to watch ${meta.sectorName}. ${meta.boomPercent}% in one day. You're welcome. 😎`,
        type: "brag",
        entities,
        metadata: { eventChainId: meta.chainId },
      });
    });

    await ctx.run("regular-tweet", async () => {
      const regulars = getPersonasByType("regular");
      if (regulars.length === 0) return;
      const persona = pickRandom(regulars);
      const reactions = [
        `wait ${meta.sectorName} is up ${meta.boomPercent}%?? I don't even own any ${meta.sectorName} stocks 😭`,
        `my coworker just made a year's salary in one day from ${meta.sectorName}. I need to start paying attention.`,
      ];
      await tweets.write({
        authorId: persona.id,
        authorHandle: persona.handle,
        authorDisplayName: persona.displayName,
        content: pickRandom(reactions),
        eventChainId: meta.chainId,
        entities,
      });
    });

    await ctx.run("finish-chain", () => removeActiveChain(meta.chainId));
  },
};
