import { nanoid } from "nanoid";
import type { SeedEventDefinition } from "@/lib/interfaces/events";
import { addActiveChain, removeActiveChain, getActiveChainCount } from "../state";
import { tweets } from "@/lib/tweets";
import { news } from "@/lib/news";
import { COMPANIES } from "@/lib/market/companies";
import { applyMarketImpact, getCompanySectorId } from "@/lib/market/impact";
import { getPersonasByType } from "@/lib/simulation/personas";
import { pickRandom, SCANDAL_REASONS } from "@/lib/simulation/world";
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
  companyId: string;
  companyName: string;
  ticker: string;
  ceoName: string;
  scandalShort: string;
  scandalDetail: string;
  willResign: boolean;
}

// ---------------------------------------------------------------------------
// Branch helpers
// ---------------------------------------------------------------------------

async function onResign(ctx: WorkflowContext, meta: ChainMeta) {
  const entities: ContentEntity[] = [
    { text: meta.companyName, type: "company" },
    { text: meta.ticker, type: "ticker" },
    { text: meta.ceoName, type: "person" },
  ];

  const interimCeo = await ctx.run("interim-ceo", () => randomName());

  // CEO resignation: sector goes volatile + drops 8-12%
  const sectorId = getCompanySectorId(meta.companyId);
  if (sectorId) {
    const drop = await ctx.run("calc-drop", () => -(8 + Math.random() * 4)); // -8 to -12%
    await applyMarketImpact(ctx, sectorId, drop, "volatile");
  }

  // Write news first to get the article ID for tweet newsLink
  const headline = `${meta.companyName} CEO ${meta.ceoName} Steps Down Amid ${meta.scandalShort} Controversy`;
  const article = await ctx.run("resignation-news", async () => {
    const newsPersonas = getPersonasByType("news");
    if (newsPersonas.length === 0) return null;
    const newsOrg = pickRandom(newsPersonas);
    return news.write({
      headline,
      summary: `The board of ${meta.companyName} has accepted the resignation of CEO ${meta.ceoName} following revelations about ${meta.scandalShort}.`,
      body: `In a move that stunned the industry, ${meta.companyName} announced today that CEO ${meta.ceoName} has resigned, effective immediately.\n\nThe departure comes after ${meta.scandalDetail}. Sources close to the board describe the situation as "deeply embarrassing."\n\n${meta.ceoName} released a brief statement: "I regret nothing. Well, maybe the ${meta.scandalShort} thing."\n\nInterim CEO ${interimCeo} will assume leadership.`,
      category: "business",
      source: newsOrg.id,
      sourceDisplayName: newsOrg.displayName,
      entities: [...entities, { text: interimCeo, type: "person" as const }],
    });
  });

  // News tweet
  await ctx.run("news-tweet", async () => {
    const newsPersonas = getPersonasByType("news");
    if (newsPersonas.length === 0) return;
    const persona = pickRandom(newsPersonas);
    const content = generateTweetContent("ceo-scandal", "news", {
      company: meta.companyName,
      ceoName: meta.ceoName,
      reason: meta.scandalDetail,
      price: "",
    });
    await tweets.write({
      authorId: persona.id, authorHandle: persona.handle,
      authorDisplayName: persona.displayName,
      content, eventChainId: meta.chainId, entities,
      newsLink: article ? { newsId: article.id, headline } : undefined,
    });
  });

  // Celebration tweet
  await ctx.run("celebration-tweet", async () => {
    const regulars = getPersonasByType("regular");
    if (regulars.length === 0) return;
    const persona = pickRandom(regulars);
    const content = generateTweetContent("ceo-scandal", "regular", {
      company: meta.companyName,
      ceoName: meta.ceoName,
      reason: meta.scandalShort,
      price: "",
    });
    await tweets.write({
      authorId: persona.id, authorHandle: persona.handle,
      authorDisplayName: persona.displayName,
      content, eventChainId: meta.chainId, entities,
    });
  });
}

async function onSurvive(ctx: WorkflowContext, meta: ChainMeta) {
  const entities: ContentEntity[] = [
    { text: meta.companyName, type: "company" },
    { text: meta.ticker, type: "ticker" },
    { text: meta.ceoName, type: "person" },
  ];

  // Survived news
  await ctx.run("survived-news", async () => {
    const newsPersonas = getPersonasByType("news");
    if (newsPersonas.length === 0) return;
    const newsOrg = pickRandom(newsPersonas);
    await news.write({
      headline: `${meta.companyName} Board Backs CEO ${meta.ceoName} Despite ${meta.scandalShort} Controversy`,
      summary: `The board of ${meta.companyName} has issued a statement of support for CEO ${meta.ceoName}.`,
      body: `Despite mounting pressure, the board of ${meta.companyName} voted unanimously to retain CEO ${meta.ceoName}.\n\n"We believe in ${meta.ceoName}'s vision for this company," said the board in a statement. "The ${meta.scandalShort} situation has been blown out of proportion."\n\n${meta.ticker} shares were slightly up on the news, seen as a stability signal.`,
      category: "business",
      source: newsOrg.id,
      sourceDisplayName: newsOrg.displayName,
      entities,
    });
  });

  // Survived tweet
  await ctx.run("survived-tweet", async () => {
    const shitposters = getPersonasByType("shitposter");
    if (shitposters.length === 0) return;
    const persona = pickRandom(shitposters);
    await tweets.write({
      authorId: persona.id, authorHandle: persona.handle,
      authorDisplayName: persona.displayName,
      content: `${meta.ceoName} SURVIVED the ${meta.scandalShort} scandal?? only in this timeline 💀`,
      eventChainId: meta.chainId, entities,
    });
  });
}

// ---------------------------------------------------------------------------
// Chain
// ---------------------------------------------------------------------------

export const ceoScandal: SeedEventDefinition = {
  name: "ceo-scandal.setup",
  description: "Start a CEO scandal chain",
  weight: 3,
  cooldownTicks: COOLDOWN_TICKS["ceo-scandal"],
  requiredConditions: async () => (await getActiveChainCount()) < 3,
  handler: async (ctx) => {
    // ── Step 1: Setup metadata ──────────────────────────────────────────
    const meta = await ctx.run("setup-meta", async () => {
      const company = pickRandom(COMPANIES);
      const scandal = pickRandom(SCANDAL_REASONS);
      const chainId = `scandal-${nanoid(6)}`;
      await addActiveChain(chainId);

      return {
        chainId,
        companyId: company.id,
        companyName: company.name,
        ticker: company.ticker,
        ceoName: company.ceoName,
        scandalShort: scandal.short,
        scandalDetail: scandal.detail,
        willResign: Math.random() < 0.6,
      } satisfies ChainMeta;
    });

    // ── Step 2: Anonymous tweet ─────────────────────────────────────────
    await ctx.run("anon-tweet", async () => {
      const regulars = getPersonasByType("regular");
      const persona = regulars.length > 0 ? pickRandom(regulars) : null;
      if (!persona) return;

      await tweets.write({
        authorId: persona.id,
        authorHandle: persona.handle,
        authorDisplayName: persona.displayName,
        content: `hearing some wild rumors about the CEO of ${meta.companyName}... something about ${meta.scandalShort}?? 👀`,
        eventChainId: meta.chainId,
        entities: [
          { text: meta.companyName, type: "company" },
          { text: meta.ticker, type: "ticker" },
          { text: meta.ceoName, type: "person" },
        ],
      });
    });

    const delay1 = await ctx.run("delay-1", () => 2 + Math.floor(Math.random() * 2));
    await ctx.sleep("after-anon-tweet", ticksToSeconds(delay1));

    // ── Step 3: Speculation wave ────────────────────────────────────────
    const specEntities: ContentEntity[] = [
      { text: meta.companyName, type: "company" },
      { text: meta.ceoName, type: "person" },
    ];

    await ctx.run("shitposter-reaction", async () => {
      const shitposters = getPersonasByType("shitposter");
      if (shitposters.length === 0) return;
      const persona = pickRandom(shitposters);
      const content = generateTweetContent("ceo-scandal", "shitposter", {
        company: meta.companyName,
        ceoName: meta.ceoName,
        reason: meta.scandalShort,
        price: "",
      });
      await tweets.write({
        authorId: persona.id, authorHandle: persona.handle,
        authorDisplayName: persona.displayName,
        content, eventChainId: meta.chainId, entities: specEntities,
      });
    });

    await ctx.run("analyst-reaction", async () => {
      const analysts = getPersonasByType("analyst");
      if (analysts.length === 0) return;
      const persona = pickRandom(analysts);
      const content = generateTweetContent("ceo-scandal", "analyst", {
        company: meta.companyName,
        ceoName: meta.ceoName,
        reason: meta.scandalShort,
        price: "—",
      });
      await tweets.write({
        authorId: persona.id, authorHandle: persona.handle,
        authorDisplayName: persona.displayName,
        content, eventChainId: meta.chainId, entities: specEntities,
      });
    });

    const delay2 = await ctx.run("delay-2", () => 3 + Math.floor(Math.random() * 4));
    await ctx.sleep("after-speculation", ticksToSeconds(delay2));

    // ── Step 4: Press conference (resign vs survive) ────────────────────
    if (meta.willResign) {
      await onResign(ctx, meta);
    } else {
      await onSurvive(ctx, meta);
    }

    await ctx.run("finish-chain", () => removeActiveChain(meta.chainId));
  },
};
