import { nanoid } from "nanoid";
import type { SeedEventDefinition } from "@/lib/interfaces/events";
import { addActiveChain, removeActiveChain, getActiveChainCount } from "../state";
import { tweets } from "@/lib/tweets";
import { dms } from "@/lib/dms";
import { news } from "@/lib/news";
import { COMPANIES } from "@/lib/market/companies";
import { applyMarketImpact, getCompanySectorId } from "@/lib/market/impact";
import { DM_PERSONAS, getPersona, getPersonasByType } from "@/lib/simulation/personas";
import { pickRandom } from "@/lib/simulation/world";
import { generateTweetContent } from "../templates/tweets";
import { generateDMContent } from "../templates/dms";
import { generateNewsArticle } from "../templates/news";
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
  insiderPersonaId: string;
  prediction: "up" | "down";
  willBeCorrect: boolean;
}

// ---------------------------------------------------------------------------
// Branch helpers
// ---------------------------------------------------------------------------

async function onCorrectPrediction(ctx: WorkflowContext, meta: ChainMeta) {
  const insider = getPersona(meta.insiderPersonaId)!;
  const insiderHandle = insider.handle.replace("@", "");
  const entities: ContentEntity[] = [
    { text: meta.ticker, type: "ticker" },
    { text: meta.companyName, type: "company" },
    { text: insiderHandle, type: "persona" },
    { text: insider.displayName, type: "persona" },
  ];

  const movePercent = await ctx.run("calc-move", () => Math.floor(Math.random() * 10 + 10)); // 10-20%

  // Market impact
  const sectorId = getCompanySectorId(meta.companyId);
  if (sectorId) {
    const change = meta.prediction === "up" ? movePercent : -movePercent;
    const status = meta.prediction === "up" ? "bull" as const : "bear" as const;
    await applyMarketImpact(ctx, sectorId, change, status);
  }

  // News article
  await ctx.run("news-article", async () => {
    const newsPersonas = getPersonasByType("news");
    if (newsPersonas.length === 0) return;
    const newsOrg = pickRandom(newsPersonas);
    const article = generateNewsArticle("insider-activity", {
      company: meta.companyName,
      ticker: meta.ticker,
      direction: meta.prediction,
      percent: String(movePercent),
    });
    await news.write({
      ...article,
      source: newsOrg.id, sourceDisplayName: newsOrg.displayName, entities,
    });
  });

  // Brag tweet from insider
  await ctx.run("correct-tweet", async () => {
    const content = generateTweetContent("insider-correct", insider.type, {
      ticker: meta.ticker,
      insiderHandle,
      direction: meta.prediction,
    });
    await tweets.write({
      authorId: insider.id, authorHandle: insider.handle,
      authorDisplayName: insider.displayName,
      content, eventChainId: meta.chainId, entities,
    });
  });

  // Brag DM
  await ctx.run("brag-dm", async () => {
    const brag = generateDMContent("insider-trading", "brag", {
      company: meta.companyName, ticker: meta.ticker,
      prediction: "", direction: meta.prediction, department: "",
      percent: String(Math.floor(Math.random() * 15 + 3)),
      amount: `$${Math.floor(Math.random() * 50000 + 5000)}`,
      sector: "",
    });
    await dms.send({
      fromPersonaId: meta.insiderPersonaId, content: brag,
      type: "brag",
      entities: [
        { text: meta.companyName, type: "company" },
        { text: meta.ticker, type: "ticker" },
      ],
      metadata: { eventChainId: meta.chainId },
    });
  });

  // Reaction from a regular
  await ctx.run("reaction", async () => {
    const regulars = getPersonasByType("regular");
    if (regulars.length === 0) return;
    const reactor = pickRandom(regulars);
    const reaction = generateTweetContent("insider-correct", "regular", {
      ticker: meta.ticker,
      insiderHandle,
      direction: meta.prediction,
    });
    await tweets.write({
      authorId: reactor.id, authorHandle: reactor.handle,
      authorDisplayName: reactor.displayName,
      content: reaction, eventChainId: meta.chainId, entities,
    });
  });
}

async function onIncorrectPrediction(ctx: WorkflowContext, meta: ChainMeta) {
  const insider = getPersona(meta.insiderPersonaId)!;
  const insiderHandle = insider.handle.replace("@", "");
  const entities: ContentEntity[] = [
    { text: meta.ticker, type: "ticker" },
    { text: meta.companyName, type: "company" },
    { text: insiderHandle, type: "persona" },
    { text: insider.displayName, type: "persona" },
  ];

  // Wrong tweet from insider
  await ctx.run("wrong-tweet", async () => {
    const content = generateTweetContent("insider-wrong", insider.type, {
      ticker: meta.ticker,
      insiderHandle,
      direction: meta.prediction,
    });
    await tweets.write({
      authorId: insider.id, authorHandle: insider.handle,
      authorDisplayName: insider.displayName,
      content, eventChainId: meta.chainId, entities,
    });
  });

  // Panic DM
  await ctx.run("panic-dm", async () => {
    const panic = generateDMContent("insider-trading", "panic", {
      company: meta.companyName, ticker: meta.ticker,
      prediction: "", direction: meta.prediction === "up" ? "down" : "up",
      department: "", percent: String(Math.floor(Math.random() * 10 + 3)),
      amount: "", sector: "",
    });
    await dms.send({
      fromPersonaId: meta.insiderPersonaId, content: panic,
      type: "panic",
      entities: [
        { text: meta.companyName, type: "company" },
        { text: meta.ticker, type: "ticker" },
      ],
      metadata: { eventChainId: meta.chainId },
    });
  });

  // Mock tweet from shitposter
  await ctx.run("mock-tweet", async () => {
    const shitposters = getPersonasByType("shitposter");
    if (shitposters.length === 0) return;
    const mocker = pickRandom(shitposters);
    const mock = generateTweetContent("insider-wrong", "shitposter", {
      ticker: meta.ticker,
      insiderHandle,
      direction: meta.prediction,
    });
    await tweets.write({
      authorId: mocker.id, authorHandle: mocker.handle,
      authorDisplayName: mocker.displayName,
      content: mock, eventChainId: meta.chainId, entities,
    });
  });
}

// ---------------------------------------------------------------------------
// Chain
// ---------------------------------------------------------------------------

export const insiderTrading: SeedEventDefinition = {
  name: "insider-trading.setup",
  description: "Start an insider trading chain",
  weight: 5,
  cooldownTicks: COOLDOWN_TICKS["insider-trading"],
  requiredConditions: async () => (await getActiveChainCount()) < 3,
  handler: async (ctx) => {
    // ── Step 1: Setup metadata ──────────────────────────────────────────
    const meta = await ctx.run("setup-meta", async () => {
      const company = pickRandom(COMPANIES);
      const insiderIds = Object.keys(DM_PERSONAS);
      const chainId = `insider-${nanoid(6)}`;
      await addActiveChain(chainId);

      return {
        chainId,
        companyId: company.id,
        companyName: company.name,
        ticker: company.ticker,
        insiderPersonaId: pickRandom(insiderIds),
        prediction: (Math.random() > 0.5 ? "up" : "down") as "up" | "down",
        willBeCorrect: Math.random() < 0.6,
      } satisfies ChainMeta;
    });

    // ── Step 2: Rumor DM ────────────────────────────────────────────────
    await ctx.run("send-dm", async () => {
      const content = generateDMContent("insider-trading", "tip", {
        company: meta.companyName,
        ticker: meta.ticker,
        prediction: meta.prediction === "up" ? "moon" : "tank",
        direction: meta.prediction,
        department: pickRandom(["finance", "engineering", "operations"]),
        percent: "",
        amount: "",
        sector: "",
      });

      await dms.send({
        fromPersonaId: meta.insiderPersonaId,
        content,
        type: "tip",
        entities: [
          { text: meta.companyName, type: "company" },
          { text: meta.ticker, type: "ticker" },
        ],
        metadata: {
          eventChainId: meta.chainId,
          relatedCompany: meta.companyId,
        },
      });
    });

    const delay1 = await ctx.run("delay-1", () => 1 + Math.floor(Math.random() * 2));
    await ctx.sleep("after-rumor", ticksToSeconds(delay1));

    // ── Step 3: Speculative tweets ──────────────────────────────────────
    const insider = getPersona(meta.insiderPersonaId);
    const specEntities: ContentEntity[] = [
      { text: meta.ticker, type: "ticker" },
      { text: meta.companyName, type: "company" },
      ...(insider ? [
        { text: insider.handle.replace("@", ""), type: "persona" as const },
        { text: insider.displayName, type: "persona" as const },
      ] : []),
    ];

    await ctx.run("insider-tweet", async () => {
      if (!insider) return;
      const content = generateTweetContent("insider-rumor", insider.type, { ticker: meta.ticker });
      await tweets.write({
        authorId: insider.id,
        authorHandle: insider.handle,
        authorDisplayName: insider.displayName,
        content,
        eventChainId: meta.chainId,
        entities: specEntities,
      });
    });

    await ctx.run("reaction-tweet", async () => {
      const regulars = getPersonasByType("regular");
      if (regulars.length === 0) return;
      const reactor = pickRandom(regulars);
      const reaction = generateTweetContent("insider-rumor", "regular", { ticker: meta.ticker });
      await tweets.write({
        authorId: reactor.id,
        authorHandle: reactor.handle,
        authorDisplayName: reactor.displayName,
        content: reaction,
        eventChainId: meta.chainId,
        entities: specEntities,
      });
    });

    const delay2 = await ctx.run("delay-2", () => 3 + Math.floor(Math.random() * 4));
    await ctx.sleep("after-speculation", ticksToSeconds(delay2));

    // ── Step 4: Outcome ─────────────────────────────────────────────────
    if (!insider) {
      await ctx.run("cleanup", () => removeActiveChain(meta.chainId));
      return;
    }

    if (meta.willBeCorrect) {
      await onCorrectPrediction(ctx, meta);
    } else {
      await onIncorrectPrediction(ctx, meta);
    }

    await ctx.run("finish-chain", () => removeActiveChain(meta.chainId));
  },
};
