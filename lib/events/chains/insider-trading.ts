import { z } from "zod";
import { nanoid } from "nanoid";
import { registerSeedEvent, registerEvent } from "../registry";
import { addActiveChain, removeActiveChain, getActiveChainCount, getSectorIndex } from "../state";
import { tweets } from "@/lib/tweets";
import { dms } from "@/lib/dms";
import { news } from "@/lib/news";
import { COMPANIES } from "@/lib/market/companies";
import { market } from "@/lib/market/market";
import { DM_PERSONAS, getPersona, getPersonasByType } from "@/lib/simulation/personas";
import { pickRandom } from "@/lib/simulation/world";
import { generateTweetContent } from "../templates/tweets";
import { generateDMContent } from "../templates/dms";
import { generateNewsArticle } from "../templates/news";
import type { ContentEntity } from "@/lib/interfaces/types";

// ---------------------------------------------------------------------------
// Shared schema for the chain metadata passed between steps
// ---------------------------------------------------------------------------

const ChainSchema = z.object({
  chainId: z.string(),
  companyId: z.string(),
  companyName: z.string(),
  ticker: z.string(),
  insiderPersonaId: z.string(),
  prediction: z.enum(["up", "down"]),
  willBeCorrect: z.boolean(),
});

type ChainMeta = z.infer<typeof ChainSchema>;

// ---------------------------------------------------------------------------
// 1. Seed → setup, then chain to rumor DM
// ---------------------------------------------------------------------------

registerSeedEvent({
  name: "insider-trading.setup",
  description: "Start an insider trading chain",
  schema: z.object({}),
  weight: 5,
  cooldownSeconds: 120,
  requiredConditions: async () => (await getActiveChainCount()) < 3,
  handler: async (ctx) => {
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

    return {
      followUpEvents: [
        { eventName: "insider-trading.rumor-dm", metadata: meta },
      ],
    };
  },
});

// ---------------------------------------------------------------------------
// 2. Rumor DM → chain to speculative tweet (10-20s delay)
// ---------------------------------------------------------------------------

registerEvent({
  name: "insider-trading.rumor-dm",
  description: "Insider DMs a tip, then triggers speculative tweet",
  schema: ChainSchema,
  handler: async (ctx, meta) => {
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

    const delay = await ctx.run("delay", () => 10 + Math.floor(Math.random() * 10));

    return {
      followUpEvents: [
        { eventName: "insider-trading.speculative-tweet", metadata: meta, delaySeconds: delay },
      ],
    };
  },
});

// ---------------------------------------------------------------------------
// 3. Speculative tweet → chain to outcome (30-60s delay)
// ---------------------------------------------------------------------------

registerEvent({
  name: "insider-trading.speculative-tweet",
  description: "Insider tweets vaguely, others react, then triggers outcome",
  schema: ChainSchema,
  handler: async (ctx, meta) => {
    const insider = getPersona(meta.insiderPersonaId);
    const entities: ContentEntity[] = [
      { text: meta.ticker, type: "ticker" },
      { text: meta.companyName, type: "company" },
      ...(insider ? [
        { text: insider.handle.replace("@", ""), type: "persona" as const },
        { text: insider.displayName, type: "persona" as const },
      ] : []),
    ];

    await Promise.all([
      ctx.run("insider-tweet", async () => {
        const insider = getPersona(meta.insiderPersonaId);
        if (!insider) return;
        const content = generateTweetContent("insider-rumor", insider.type, { ticker: meta.ticker });
        await tweets.write({
          authorId: insider.id,
          authorHandle: insider.handle,
          authorDisplayName: insider.displayName,
          content,
          eventChainId: meta.chainId,
          entities,
        });
      }),
      ctx.run("reaction-tweet", async () => {
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
          entities,
        });
      }),
    ]);

    const delay = await ctx.run("delay", () => 30 + Math.floor(Math.random() * 30));

    return {
      followUpEvents: [
        { eventName: "insider-trading.outcome", metadata: meta, delaySeconds: delay },
      ],
    };
  },
});

// ---------------------------------------------------------------------------
// 4. Outcome — correct or incorrect, chain ends
// ---------------------------------------------------------------------------

registerEvent({
  name: "insider-trading.outcome",
  description: "The prediction plays out or fails",
  schema: ChainSchema,
  handler: async (ctx, meta) => {
    const insider = getPersona(meta.insiderPersonaId);
    if (!insider) {
      await ctx.run("cleanup", () => removeActiveChain(meta.chainId));
      return { followUpEvents: [] };
    }

    const insiderHandle = insider.handle.replace("@", "");
    const entities: ContentEntity[] = [
      { text: meta.ticker, type: "ticker" },
      { text: meta.companyName, type: "company" },
      { text: insiderHandle, type: "persona" },
      { text: insider.displayName, type: "persona" },
    ];

    if (meta.willBeCorrect) {
      await Promise.all([
        ctx.run("correct-tweet", async () => {
          const content = generateTweetContent("insider-correct", insider.type, {
            ticker: meta.ticker,
            insiderHandle: insider.handle.replace("@", ""),
            direction: meta.prediction,
          });
          await tweets.write({
            authorId: insider.id, authorHandle: insider.handle,
            authorDisplayName: insider.displayName,
            content, eventChainId: meta.chainId, entities,
          });
        }),
        ctx.run("brag-dm", async () => {
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
        }),
        ctx.run("reaction", async () => {
          const regulars = getPersonasByType("regular");
          if (regulars.length === 0) return;
          const reactor = pickRandom(regulars);
          const reaction = generateTweetContent("insider-correct", "regular", {
            ticker: meta.ticker,
            insiderHandle: insider.handle.replace("@", ""),
            direction: meta.prediction,
          });
          await tweets.write({
            authorId: reactor.id, authorHandle: reactor.handle,
            authorDisplayName: reactor.displayName,
            content: reaction, eventChainId: meta.chainId, entities,
          });
        }),
        ctx.run("news-article", async () => {
          const newsPersonas = getPersonasByType("news");
          if (newsPersonas.length === 0) return;
          const newsOrg = pickRandom(newsPersonas);
          const article = generateNewsArticle("insider-activity", {
            company: meta.companyName,
            ticker: meta.ticker,
            direction: meta.prediction,
            percent: String(Math.floor(Math.random() * 12 + 3)),
          });
          await news.write({
            ...article,
            source: newsOrg.id, sourceDisplayName: newsOrg.displayName, entities,
          });
        }),
      ]);

      // Boost the company's primary sector index by 2-5%
      await ctx.run("market-impact", async () => {
        const company = COMPANIES.find((c) => c.id === meta.companyId);
        if (!company || company.sectors.length === 0) return;
        const sectorId = company.sectors[0].sectorId;
        const currentIndex = await getSectorIndex(sectorId);
        await market.updateSectorIndex(sectorId, currentIndex * 1.03);
      });
    } else {
      await Promise.all([
        ctx.run("wrong-tweet", async () => {
          const content = generateTweetContent("insider-wrong", insider.type, {
            ticker: meta.ticker,
            insiderHandle: insider.handle.replace("@", ""),
            direction: meta.prediction,
          });
          await tweets.write({
            authorId: insider.id, authorHandle: insider.handle,
            authorDisplayName: insider.displayName,
            content, eventChainId: meta.chainId, entities,
          });
        }),
        ctx.run("panic-dm", async () => {
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
        }),
        ctx.run("mock-tweet", async () => {
          const shitposters = getPersonasByType("shitposter");
          if (shitposters.length === 0) return;
          const mocker = pickRandom(shitposters);
          const mock = generateTweetContent("insider-wrong", "shitposter", {
            ticker: meta.ticker,
            insiderHandle: insider.handle.replace("@", ""),
            direction: meta.prediction,
          });
          await tweets.write({
            authorId: mocker.id, authorHandle: mocker.handle,
            authorDisplayName: mocker.displayName,
            content: mock, eventChainId: meta.chainId, entities,
          });
        }),
      ]);
    }

    await ctx.run("finish-chain", () => removeActiveChain(meta.chainId));
    return { followUpEvents: [] };
  },
});
