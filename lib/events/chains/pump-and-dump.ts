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

const ChainSchema = z.object({
  chainId: z.string(),
  companyName: z.string(),
  ticker: z.string(),
  manipulatorId: z.string(),
});

type ChainMeta = z.infer<typeof ChainSchema>;

// 1. Seed → insider DM
registerSeedEvent({
  name: "pump-and-dump.setup",
  description: "Start a pump and dump scheme",
  schema: z.object({}),
  weight: 3,
  cooldownSeconds: 180,
  requiredConditions: async () => (await getActiveChainCount()) < 3,
  handler: async (ctx) => {
    const meta = await ctx.run("setup-meta", async () => {
      const company = pickRandom(COMPANIES);
      const insiderIds = Object.keys(DM_PERSONAS);
      const chainId = `pump-${nanoid(6)}`;
      await addActiveChain(chainId);
      return {
        chainId,
        companyName: company.name,
        ticker: company.ticker,
        manipulatorId: pickRandom(insiderIds),
      } satisfies ChainMeta;
    });
    return {
      followUpEvents: [
        { eventName: "pump-and-dump.insider-dm", metadata: meta },
      ],
    };
  },
});

// 2. DM → hype tweets (10-20s)
registerEvent({
  name: "pump-and-dump.insider-dm",
  description: "Manipulator DMs about the upcoming pump",
  schema: ChainSchema,
  handler: async (ctx, meta) => {
    await ctx.run("send-dm", async () => {
      const content = generateDMContent("market-manipulation", "tip", {
        company: meta.companyName,
        ticker: meta.ticker,
        announcement: "something huge",
      });
      await dms.send({
        fromPersonaId: meta.manipulatorId,
        content,
        type: "tip",
        entities: [
          { text: meta.companyName, type: "company" },
          { text: meta.ticker, type: "ticker" },
        ],
        metadata: { eventChainId: meta.chainId, relatedCompany: meta.companyName },
      });
    });

    const delay = await ctx.run("delay", () => 10 + Math.floor(Math.random() * 10));
    return {
      followUpEvents: [
        { eventName: "pump-and-dump.hype-tweets", metadata: meta, delaySeconds: delay },
      ],
    };
  },
});

// 3. Hype tweets → peak (20-40s)
registerEvent({
  name: "pump-and-dump.hype-tweets",
  description: "Manipulator and others hype the stock",
  schema: ChainSchema,
  handler: async (ctx, meta) => {
    const entities: ContentEntity[] = [
      { text: meta.ticker, type: "ticker" },
      { text: meta.companyName, type: "company" },
    ];
    const manipulator = getPersona(meta.manipulatorId);

    await Promise.all([
      ctx.run("manipulator-tweet", async () => {
        if (!manipulator) return;
        const content = generateTweetContent("stock-rises", "shitposter", {
          company: meta.companyName,
          ticker: meta.ticker,
          percent: String(Math.floor(Math.random() * 10 + 5)),
          reason: "big things coming",
          price: "",
        });
        await tweets.write({
          authorId: manipulator.id,
          authorHandle: manipulator.handle,
          authorDisplayName: manipulator.displayName,
          content,
          eventChainId: meta.chainId,
          entities,
        });
      }),
      ctx.run("fomo-tweet", async () => {
        const regulars = getPersonasByType("regular");
        if (regulars.length === 0) return;
        const persona = pickRandom(regulars);
        await tweets.write({
          authorId: persona.id,
          authorHandle: persona.handle,
          authorDisplayName: persona.displayName,
          content: `everyone is talking about ${meta.ticker} right now... should I get in?? FOMO is real 😰`,
          eventChainId: meta.chainId,
          entities,
        });
      }),
      ctx.run("followup-dm", async () => {
        const content = generateDMContent("market-manipulation", "followup", {
          company: meta.companyName,
          ticker: meta.ticker,
          announcement: "",
        });
        await dms.send({
          fromPersonaId: meta.manipulatorId,
          content,
          type: "followup",
          entities: [
            { text: meta.companyName, type: "company" },
            { text: meta.ticker, type: "ticker" },
          ],
          metadata: { eventChainId: meta.chainId },
        });
      }),
    ]);

    const delay = await ctx.run("delay", () => 20 + Math.floor(Math.random() * 20));
    return {
      followUpEvents: [
        { eventName: "pump-and-dump.dump", metadata: meta, delaySeconds: delay },
      ],
    };
  },
});

// 4. Dump — stock crashes, news, panic
registerEvent({
  name: "pump-and-dump.dump",
  description: "The dump happens",
  schema: ChainSchema,
  handler: async (ctx, meta) => {
    const entities: ContentEntity[] = [
      { text: meta.ticker, type: "ticker" },
      { text: meta.companyName, type: "company" },
    ];

    await Promise.all([
      ctx.run("crash-news", async () => {
        const newsPersonas = getPersonasByType("news");
        if (newsPersonas.length === 0) return;
        const org = pickRandom(newsPersonas);
        const article = generateNewsArticle("regulatory-investigation", {
          company: meta.companyName,
          ticker: meta.ticker,
          percent: String(Math.floor(Math.random() * 15 + 5)),
          detail: 'Regulators have announced they are investigating "coordinated activity" on social media that appeared to drive the initial price increase.',
        });
        await news.write({
          ...article,
          source: org.id,
          sourceDisplayName: org.displayName,
          entities,
        });
      }),
      ctx.run("bagholders-tweet", async () => {
        const shitposters = getPersonasByType("shitposter");
        if (shitposters.length === 0) return;
        const persona = pickRandom(shitposters);
        await tweets.write({
          authorId: persona.id,
          authorHandle: persona.handle,
          authorDisplayName: persona.displayName,
          content: `WHO TOLD ME TO BUY ${meta.ticker}?? I WANT NAMES. I WANT REFUNDS. I WANT MY RENT MONEY BACK. 😭`,
          eventChainId: meta.chainId,
          entities,
        });
      }),
      ctx.run("manipulator-dm", async () => {
        const content = generateDMContent("market-manipulation", "panic", {
          company: meta.companyName,
          ticker: meta.ticker,
          announcement: "",
        });
        await dms.send({
          fromPersonaId: meta.manipulatorId,
          content,
          type: "panic",
          entities: [
            { text: meta.companyName, type: "company" },
            { text: meta.ticker, type: "ticker" },
          ],
          metadata: { eventChainId: meta.chainId },
        });
      }),
      ctx.run("analyst-tweet", async () => {
        const analysts = getPersonasByType("analyst");
        if (analysts.length === 0) return;
        const persona = pickRandom(analysts);
        await tweets.write({
          authorId: persona.id,
          authorHandle: persona.handle,
          authorDisplayName: persona.displayName,
          content: `${meta.ticker} is a textbook pump and dump. If you fell for it, take this as an expensive lesson. I warned you.`,
          eventChainId: meta.chainId,
          entities,
        });
      }),
    ]);

    // Decrease the company's primary sector index by 1-3%
    await ctx.run("market-impact", async () => {
      const company = COMPANIES.find((c) => c.name === meta.companyName);
      if (!company || company.sectors.length === 0) return;
      const sectorId = company.sectors[0].sectorId;
      const currentIndex = await getSectorIndex(sectorId);
      const drop = 1 + Math.random() * 2; // 1-3%
      await market.updateSectorIndex(sectorId, currentIndex * (1 - drop / 100));
    });

    await ctx.run("finish-chain", () => removeActiveChain(meta.chainId));
    return { followUpEvents: [] };
  },
});
