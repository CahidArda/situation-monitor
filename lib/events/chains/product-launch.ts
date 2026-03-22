import { nanoid } from "nanoid";
import type { SeedEventDefinition } from "@/lib/interfaces/events";
import { addActiveChain, removeActiveChain, getActiveChainCount } from "../state";
import { tweets } from "@/lib/tweets";
import { news } from "@/lib/news";
import { COMPANIES } from "@/lib/market/companies";
import { applyMarketImpact, getCompanySectorIdByName } from "@/lib/market/impact";
import { getPersonasByType } from "@/lib/simulation/personas";
import { pickRandom, randomProduct } from "@/lib/simulation/world";
import { randomName } from "@/lib/simulation/names";
import { generateTweetContent } from "../templates/tweets";
import { ticksToSeconds, COOLDOWN_TICKS } from "@/lib/constants";
import type { ContentEntity } from "@/lib/interfaces/types";
import type { WorkflowContext } from "@upstash/workflow";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChainMeta {
  chainId: string;
  companyName: string;
  ticker: string;
  product: string;
  isHit: boolean;
}

// ---------------------------------------------------------------------------
// Branch helpers
// ---------------------------------------------------------------------------

async function onHit(ctx: WorkflowContext, meta: ChainMeta, impactPercent: number) {
  const entities: ContentEntity[] = [
    { text: meta.companyName, type: "company" },
    { text: meta.ticker, type: "ticker" },
    { text: meta.product, type: "commodity" },
  ];

  // Market boost
  const sectorId = getCompanySectorIdByName(meta.companyName);
  if (sectorId) {
    await applyMarketImpact(ctx, sectorId, impactPercent, "bull");
  }

  // Hit news
  await ctx.run("hit-news", async () => {
    const newsPersonas = getPersonasByType("news");
    if (newsPersonas.length === 0) return;
    const org = pickRandom(newsPersonas);
    await news.write({
      headline: `${meta.companyName}'s ${meta.product} Sells Out in Hours`,
      summary: `Against all odds, ${meta.product} is a commercial hit. ${meta.ticker} up sharply.`,
      body: `In a development that surprised even the most optimistic analysts, ${meta.companyName}'s ${meta.product} sold out within hours of launch.\n\n"I genuinely did not see this coming," admitted one analyst. "There are apparently a lot of people who want a ${meta.product}."\n\n${meta.ticker} shares rose on the news.`,
      category: "business",
      source: org.id,
      sourceDisplayName: org.displayName,
      entities,
    });
  });

  // Hit tweet
  await ctx.run("hit-tweet", async () => {
    const shitposters = getPersonasByType("shitposter");
    if (shitposters.length === 0) return;
    const persona = pickRandom(shitposters);
    await tweets.write({
      authorId: persona.id,
      authorHandle: persona.handle,
      authorDisplayName: persona.displayName,
      content: `the ${meta.product} SOLD OUT?? we live in the most unserious timeline 😭😭 ${meta.ticker} to the moon I guess`,
      eventChainId: meta.chainId,
      entities,
    });
  });
}

async function onFlop(ctx: WorkflowContext, meta: ChainMeta, impactPercent: number) {
  const entities: ContentEntity[] = [
    { text: meta.companyName, type: "company" },
    { text: meta.ticker, type: "ticker" },
    { text: meta.product, type: "commodity" },
  ];

  // Market drop
  const sectorId = getCompanySectorIdByName(meta.companyName);
  if (sectorId) {
    await applyMarketImpact(ctx, sectorId, -impactPercent, "bear");
  }

  // Flop news
  await ctx.run("flop-news", async () => {
    const newsPersonas = getPersonasByType("news");
    if (newsPersonas.length === 0) return;
    const org = pickRandom(newsPersonas);
    await news.write({
      headline: `${meta.companyName}'s ${meta.product} Launch Falls Flat`,
      summary: `${meta.product} widely mocked on social media. ${meta.ticker} slips.`,
      body: `${meta.companyName}'s much-hyped ${meta.product} has been met with near-universal mockery since its launch.\n\n"Who greenlit this?" became a trending topic within hours. The product has been called "a solution in search of a problem" and "proof that corporate innovation has gone too far."\n\n${meta.ticker} shares dipped on the reception.`,
      category: "business",
      source: org.id,
      sourceDisplayName: org.displayName,
      entities,
    });
  });

  // Flop tweet
  await ctx.run("flop-tweet", async () => {
    const shitposters = getPersonasByType("shitposter");
    if (shitposters.length === 0) return;
    const persona = pickRandom(shitposters);
    await tweets.write({
      authorId: persona.id,
      authorHandle: persona.handle,
      authorDisplayName: persona.displayName,
      content: `${meta.companyName} really spent millions developing a ${meta.product} and NOBODY wants it 💀 ${meta.ticker} holders in shambles`,
      eventChainId: meta.chainId,
      entities,
    });
  });
}

// ---------------------------------------------------------------------------
// Chain
// ---------------------------------------------------------------------------

export const productLaunch: SeedEventDefinition = {
  name: "product-launch.setup",
  description: "Start a product launch chain",
  weight: 4,
  cooldownTicks: COOLDOWN_TICKS["product-launch"],
  requiredConditions: async () => (await getActiveChainCount()) < 3,
  handler: async (ctx) => {
    // ── Step 1: Setup metadata ──────────────────────────────────────────
    const meta = await ctx.run("setup-meta", async () => {
      const company = pickRandom(COMPANIES);
      const chainId = `product-${nanoid(6)}`;
      await addActiveChain(chainId);
      return {
        chainId,
        companyName: company.name,
        ticker: company.ticker,
        product: randomProduct(),
        isHit: Math.random() < 0.4,
      } satisfies ChainMeta;
    });

    // ── Step 2: Announcement ────────────────────────────────────────────
    const entities: ContentEntity[] = [
      { text: meta.companyName, type: "company" },
      { text: meta.ticker, type: "ticker" },
      { text: meta.product, type: "commodity" },
    ];

    const headline = `${meta.companyName} Unveils ${meta.product} to Mixed Reactions`;
    const newsArticle = await ctx.run("announcement-news", async () => {
      const newsPersonas = getPersonasByType("news");
      if (newsPersonas.length === 0) return null;
      const org = pickRandom(newsPersonas);
      const analystName = randomName();
      return news.write({
        headline,
        summary: `${meta.companyName} (${meta.ticker}) announced its latest product. Industry observers are divided.`,
        body: `${meta.companyName} surprised markets today with the announcement of its newest offering: ${meta.product}.\n\n"This is either brilliant or completely insane," said ${analystName}, an industry analyst. "Possibly both."\n\n${meta.ticker} shares moved on the news as investors tried to determine whether ${meta.product} represents genuine innovation or a late-night fever dream from the C-suite.`,
        category: "business",
        source: org.id,
        sourceDisplayName: org.displayName,
        entities: [...entities, { text: analystName, type: "person" as const }],
      });
    });

    await ctx.run("official-tweet", async () => {
      const officials = getPersonasByType("official");
      const newsPersonas = getPersonasByType("news");
      const persona = officials.length > 0 ? pickRandom(officials) : newsPersonas.length > 0 ? pickRandom(newsPersonas) : null;
      if (!persona) return;
      const content = generateTweetContent("product-launch", "news", {
        company: meta.companyName,
        product: meta.product,
        direction: meta.isHit ? "up" : "down",
        percent: String(Math.floor(Math.random() * 5 + 1)),
      });
      await tweets.write({
        authorId: persona.id,
        authorHandle: persona.handle,
        authorDisplayName: persona.displayName,
        content,
        eventChainId: meta.chainId,
        entities,
        newsLink: newsArticle ? { newsId: newsArticle.id, headline } : undefined,
      });
    });

    const delay1 = await ctx.run("delay-1", () => 2 + Math.floor(Math.random() * 2));
    await ctx.sleep("after-announcement", ticksToSeconds(delay1));

    // ── Step 3: Reaction wave ───────────────────────────────────────────
    const reactionEntities: ContentEntity[] = [
      { text: meta.companyName, type: "company" },
      { text: meta.product, type: "commodity" },
    ];

    await ctx.run("shitpost-reaction", async () => {
      const shitposters = getPersonasByType("shitposter");
      if (shitposters.length === 0) return;
      const persona = pickRandom(shitposters);
      const content = generateTweetContent("product-launch", "shitposter", {
        company: meta.companyName,
        product: meta.product,
        direction: "",
        percent: "",
      });
      await tweets.write({
        authorId: persona.id,
        authorHandle: persona.handle,
        authorDisplayName: persona.displayName,
        content,
        eventChainId: meta.chainId,
        entities: reactionEntities,
      });
    });

    await ctx.run("regular-reaction", async () => {
      const regulars = getPersonasByType("regular");
      if (regulars.length === 0) return;
      const persona = pickRandom(regulars);
      const content = generateTweetContent("product-launch", "regular", {
        company: meta.companyName,
        product: meta.product,
        direction: "",
        percent: "",
      });
      await tweets.write({
        authorId: persona.id,
        authorHandle: persona.handle,
        authorDisplayName: persona.displayName,
        content,
        eventChainId: meta.chainId,
        entities: reactionEntities,
      });
    });

    await ctx.run("analyst-reaction", async () => {
      const analysts = getPersonasByType("analyst");
      if (analysts.length === 0) return;
      const persona = pickRandom(analysts);
      const content = generateTweetContent("product-launch", "analyst", {
        company: meta.companyName,
        product: meta.product,
        direction: meta.isHit ? "up" : "down",
        percent: String(Math.floor(Math.random() * 5 + 1)),
      });
      await tweets.write({
        authorId: persona.id,
        authorHandle: persona.handle,
        authorDisplayName: persona.displayName,
        content,
        eventChainId: meta.chainId,
        entities: reactionEntities,
      });
    });

    const delay2 = await ctx.run("delay-2", () => 2 + Math.floor(Math.random() * 2));
    await ctx.sleep("after-reactions", ticksToSeconds(delay2));

    // ── Step 4: Outcome (hit vs flop) ───────────────────────────────────
    const impactPercent = await ctx.run("calc-impact", () => 8 + Math.random() * 7); // 8-15%

    if (meta.isHit) {
      await onHit(ctx, meta, impactPercent);
    } else {
      await onFlop(ctx, meta, impactPercent);
    }

    await ctx.run("finish-chain", () => removeActiveChain(meta.chainId));
  },
};
