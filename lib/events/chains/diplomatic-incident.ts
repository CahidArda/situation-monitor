import { nanoid } from "nanoid";
import type { SeedEventDefinition } from "@/lib/interfaces/events";
import { addActiveChain, removeActiveChain, getActiveChainCount } from "../state";
import { tweets } from "@/lib/tweets";
import { news } from "@/lib/news";
import { dms } from "@/lib/dms";
import { SECTORS } from "@/lib/market/sectors";
import { applyMarketImpact } from "@/lib/market/impact";
import { DM_PERSONAS, getPersonasByType } from "@/lib/simulation/personas";
import {
  pickRandom,
  pickRandomCountryPair,
  randomDiplomaticCause,
} from "@/lib/simulation/world";
import { randomName } from "@/lib/simulation/names";
import { generateTweetContent } from "../templates/tweets";
import { generateNewsArticle } from "../templates/news";
import { ticksToSeconds, COOLDOWN_TICKS } from "@/lib/constants";
import type { ContentEntity } from "@/lib/interfaces/types";
import type { WorkflowContext } from "@upstash/workflow";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChainMeta {
  chainId: string;
  country1: string;
  country2: string;
  city: string;
  issue: string;
  affectedSector: string;
  affectedSectorId: string;
  willResolve: boolean;
}

// ---------------------------------------------------------------------------
// Branch helpers
// ---------------------------------------------------------------------------

async function onResolve(ctx: WorkflowContext, meta: ChainMeta) {
  const entities: ContentEntity[] = [
    { text: meta.country1, type: "sector" },
    { text: meta.country2, type: "sector" },
    { text: meta.affectedSector, type: "sector" },
  ];

  // Market recovery ~6%
  await applyMarketImpact(ctx, meta.affectedSectorId, 6, "stable", "market-recovery");

  // Resolution news
  await ctx.run("resolution-news", async () => {
    const newsPersonas = getPersonasByType("news");
    if (newsPersonas.length === 0) return;
    const org = pickRandom(newsPersonas);
    await news.write({
      headline: `${meta.country1} and ${meta.country2} Reach Agreement on ${meta.issue}`,
      summary: `Tensions eased as both nations agreed to a compromise described as "absurd but workable."`,
      body: `In a surprise development, ${meta.country1} and ${meta.country2} announced a resolution to the dispute over ${meta.issue}.\n\nThe compromise involves what diplomats are calling "creative concessions on both sides." Details remain vague.\n\nThe ${meta.affectedSector} sector recovered on the news.`,
      category: "world",
      source: org.id,
      sourceDisplayName: org.displayName,
      entities,
    });
  });

  // Relief tweet
  await ctx.run("relief-tweet", async () => {
    const shitposters = getPersonasByType("shitposter");
    if (shitposters.length === 0) return;
    const persona = pickRandom(shitposters);
    await tweets.write({
      authorId: persona.id,
      authorHandle: persona.handle,
      authorDisplayName: persona.displayName,
      content: `${meta.country1} and ${meta.country2} made up over ${meta.issue}. well that was dramatic for nothing 💀`,
      eventChainId: meta.chainId,
      entities,
    });
  });
}

async function onProlong(ctx: WorkflowContext, meta: ChainMeta) {
  const entities: ContentEntity[] = [
    { text: meta.country1, type: "sector" },
    { text: meta.country2, type: "sector" },
    { text: meta.affectedSector, type: "sector" },
  ];

  // Prolonged news
  await ctx.run("prolonged-news", async () => {
    const newsPersonas = getPersonasByType("news");
    if (newsPersonas.length === 0) return;
    const org = pickRandom(newsPersonas);
    await news.write({
      headline: `${meta.country1}-${meta.country2} Dispute Over ${meta.issue} Enters New Phase`,
      summary: `No resolution in sight as both nations dig in. The ${meta.affectedSector} sector remains volatile.`,
      body: `The dispute between ${meta.country1} and ${meta.country2} over ${meta.issue} showed no signs of abating today.\n\nBoth governments have recalled ambassadors for "consultations." The ${meta.affectedSector} sector continues to feel the impact.\n\nAnalysts warn this could drag on for weeks.`,
      category: "world",
      source: org.id,
      sourceDisplayName: org.displayName,
      entities,
    });
  });

  // DM warning
  await ctx.run("dm-warning", async () => {
    const insiderIds = Object.keys(DM_PERSONAS);
    const insiderId = pickRandom(insiderIds);
    await dms.send({
      fromPersonaId: insiderId,
      content: `This ${meta.country1}/${meta.country2} thing isn't going away. Stay out of ${meta.affectedSector} for now.`,
      type: "tip",
      entities: [
        { text: meta.country1, type: "sector" },
        { text: meta.country2, type: "sector" },
        { text: meta.affectedSector, type: "sector" },
      ],
      metadata: { eventChainId: meta.chainId },
    });
  });
}

// ---------------------------------------------------------------------------
// Chain
// ---------------------------------------------------------------------------

export const diplomaticIncident: SeedEventDefinition = {
  name: "diplomatic-incident.setup",
  description: "Start a diplomatic incident chain",
  weight: 3,
  cooldownTicks: COOLDOWN_TICKS["diplomatic-incident"],
  requiredConditions: async () => (await getActiveChainCount()) < 3,
  handler: async (ctx) => {
    // ── Step 1: Setup metadata ──────────────────────────────────────────
    const meta = await ctx.run("setup-meta", async () => {
      const [c1, c2] = pickRandomCountryPair();
      const sector = pickRandom(SECTORS);
      const chainId = `diplo-${nanoid(6)}`;
      await addActiveChain(chainId);
      return {
        chainId,
        country1: c1.name,
        country2: c2.name,
        city: pickRandom(c1.cities),
        issue: randomDiplomaticCause(),
        affectedSector: sector.name,
        affectedSectorId: sector.id,
        willResolve: Math.random() < 0.7,
      } satisfies ChainMeta;
    });

    // ── Step 2: Breaking news + market impact ───────────────────────────
    const entities: ContentEntity[] = [
      { text: meta.country1, type: "sector" },
      { text: meta.country2, type: "sector" },
      { text: meta.affectedSector, type: "sector" },
    ];

    // Set affected sector to volatile and drop ~8%
    await applyMarketImpact(ctx, meta.affectedSectorId, -8, "volatile");

    // Write news first to get article ID for tweet newsLink
    const headline = `${meta.country1} and ${meta.country2} Clash Over ${meta.issue}`;
    const newsArticle = await ctx.run("news-article", async () => {
      const newsPersonas = getPersonasByType("news");
      if (newsPersonas.length === 0) return null;
      const org = pickRandom(newsPersonas);
      const official1 = randomName();
      const official2 = randomName();
      const article = generateNewsArticle("diplomatic-incident", {
        country1: meta.country1,
        country2: meta.country2,
        city: meta.city,
        issue: meta.issue,
        incident: meta.issue,
        official1Name: official1,
        official1Title: "Minister of Foreign Affairs",
        official2Name: official2,
        quote1: "completely unacceptable and frankly embarrassing",
        quote2: "a gross overreaction to a minor misunderstanding",
        issueDetail: `overlapping claims related to ${meta.issue}`,
        previousIncident: "last year's trade tariff disagreement",
        affectedSectors: meta.affectedSector,
        mainIndex: "Global",
        indexDirection: "down",
        indexPercent: (Math.random() * 2 + 0.3).toFixed(1),
      });
      return news.write({
        ...article,
        source: org.id,
        sourceDisplayName: org.displayName,
        entities: [...entities, { text: official1, type: "person" as const }, { text: official2, type: "person" as const }],
      });
    });

    // Breaking tweet
    await ctx.run("breaking-tweet", async () => {
      const newsPersonas = getPersonasByType("news");
      if (newsPersonas.length === 0) return;
      const persona = pickRandom(newsPersonas);
      const content = generateTweetContent("diplomatic-incident", "news", {
        country1: meta.country1,
        country2: meta.country2,
        issue: meta.issue,
        sector: meta.affectedSector,
      });
      await tweets.write({
        authorId: persona.id,
        authorHandle: persona.handle,
        authorDisplayName: persona.displayName,
        content,
        eventChainId: meta.chainId,
        newsLink: newsArticle ? { newsId: newsArticle.id, headline } : undefined,
        entities,
      });
    });

    // Insider DM
    await ctx.run("insider-dm", async () => {
      const insiderIds = Object.keys(DM_PERSONAS);
      const insiderId = pickRandom(insiderIds);
      await dms.send({
        fromPersonaId: insiderId,
        content: `The ${meta.country1}/${meta.country2} thing is going to hit ${meta.affectedSector} hard. Watch closely.`,
        type: "tip",
        entities: [
          { text: meta.country1, type: "sector" },
          { text: meta.country2, type: "sector" },
          { text: meta.affectedSector, type: "sector" },
        ],
        metadata: { eventChainId: meta.chainId },
      });
    });

    const delay1 = await ctx.run("delay-1", () => 2 + Math.floor(Math.random() * 2));
    await ctx.sleep("after-breaking-news", ticksToSeconds(delay1));

    // ── Step 3: Reaction wave ───────────────────────────────────────────
    await ctx.run("analyst-take", async () => {
      const analysts = getPersonasByType("analyst");
      if (analysts.length === 0) return;
      const persona = pickRandom(analysts);
      const content = generateTweetContent("diplomatic-incident", "analyst", {
        country1: meta.country1,
        country2: meta.country2,
        issue: meta.issue,
        sector: meta.affectedSector,
      });
      await tweets.write({
        authorId: persona.id,
        authorHandle: persona.handle,
        authorDisplayName: persona.displayName,
        content,
        eventChainId: meta.chainId,
        entities,
      });
    });

    await ctx.run("shitpost-take", async () => {
      const shitposters = getPersonasByType("shitposter");
      if (shitposters.length === 0) return;
      const persona = pickRandom(shitposters);
      const content = generateTweetContent("diplomatic-incident", "shitposter", {
        country1: meta.country1,
        country2: meta.country2,
        issue: meta.issue,
        sector: meta.affectedSector,
      });
      await tweets.write({
        authorId: persona.id,
        authorHandle: persona.handle,
        authorDisplayName: persona.displayName,
        content,
        eventChainId: meta.chainId,
        entities,
      });
    });

    await ctx.run("regular-take", async () => {
      const regulars = getPersonasByType("regular");
      if (regulars.length === 0) return;
      const persona = pickRandom(regulars);
      const content = generateTweetContent("diplomatic-incident", "regular", {
        country1: meta.country1,
        country2: meta.country2,
        issue: meta.issue,
        sector: meta.affectedSector,
      });
      await tweets.write({
        authorId: persona.id,
        authorHandle: persona.handle,
        authorDisplayName: persona.displayName,
        content,
        eventChainId: meta.chainId,
        entities,
      });
    });

    const delay2 = await ctx.run("delay-2", () => 3 + Math.floor(Math.random() * 4));
    await ctx.sleep("after-reactions", ticksToSeconds(delay2));

    // ── Step 4: Resolution (resolve vs prolong) ─────────────────────────
    if (meta.willResolve) {
      await onResolve(ctx, meta);
    } else {
      await onProlong(ctx, meta);
    }

    await ctx.run("finish-chain", () => removeActiveChain(meta.chainId));
  },
};
