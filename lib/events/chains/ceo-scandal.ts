import { z } from "zod";
import { nanoid } from "nanoid";
import { registerSeedEvent, registerEvent } from "../registry";
import { addActiveChain, removeActiveChain, getActiveChainCount } from "../state";
import { tweets } from "@/lib/tweets";
import { news } from "@/lib/news";
import { COMPANIES } from "@/lib/market/companies";
import { market } from "@/lib/market/market";
import { getPersonasByType } from "@/lib/simulation/personas";
import { pickRandom, SCANDAL_REASONS } from "@/lib/simulation/world";
import { randomName } from "@/lib/simulation/names";
import { generateTweetContent } from "../templates/tweets";
import type { ContentEntity } from "@/lib/interfaces/types";

// ---------------------------------------------------------------------------
// Shared schema
// ---------------------------------------------------------------------------

const ChainSchema = z.object({
  chainId: z.string(),
  companyId: z.string(),
  companyName: z.string(),
  ticker: z.string(),
  ceoName: z.string(),
  scandalShort: z.string(),
  scandalDetail: z.string(),
  willResign: z.boolean(),
});

type ChainMeta = z.infer<typeof ChainSchema>;

// ---------------------------------------------------------------------------
// 1. Seed → setup, chain to anonymous tweet
// ---------------------------------------------------------------------------

registerSeedEvent({
  name: "ceo-scandal.setup",
  description: "Start a CEO scandal chain",
  schema: z.object({}),
  weight: 3,
  cooldownSeconds: 180,
  requiredConditions: async () => (await getActiveChainCount()) < 3,
  handler: async (ctx) => {
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

    return {
      followUpEvents: [
        { eventName: "ceo-scandal.anonymous-tweet", metadata: meta },
      ],
    };
  },
});

// ---------------------------------------------------------------------------
// 2. Anonymous tweet → speculation wave (15-30s)
// ---------------------------------------------------------------------------

registerEvent({
  name: "ceo-scandal.anonymous-tweet",
  description: "Anonymous account tweets rumor about CEO",
  schema: ChainSchema,
  handler: async (ctx, meta) => {
    const entities: ContentEntity[] = [
      { text: meta.companyName, type: "company" },
      { text: meta.ticker, type: "ticker" },
      { text: meta.ceoName, type: "person" },
    ];

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
        entities,
      });
    });

    const delay = await ctx.run("delay", () => 15 + Math.floor(Math.random() * 15));

    return {
      followUpEvents: [
        { eventName: "ceo-scandal.speculation-wave", metadata: meta, delaySeconds: delay },
      ],
    };
  },
});

// ---------------------------------------------------------------------------
// 3. Speculation wave → press conference (30-60s)
// ---------------------------------------------------------------------------

registerEvent({
  name: "ceo-scandal.speculation-wave",
  description: "Multiple personas react to the CEO rumor",
  schema: ChainSchema,
  handler: async (ctx, meta) => {
    const entities: ContentEntity[] = [
      { text: meta.companyName, type: "company" },
      { text: meta.ceoName, type: "person" },
    ];

    await Promise.all([
      ctx.run("shitposter-reaction", async () => {
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
          content, eventChainId: meta.chainId, entities,
        });
      }),
      ctx.run("analyst-reaction", async () => {
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
          content, eventChainId: meta.chainId, entities,
        });
      }),
    ]);

    const delay = await ctx.run("delay", () => 30 + Math.floor(Math.random() * 30));

    return {
      followUpEvents: [
        { eventName: "ceo-scandal.press-conference", metadata: meta, delaySeconds: delay },
      ],
    };
  },
});

// ---------------------------------------------------------------------------
// 4. Press conference → outcome (resign or survive), chain ends
// ---------------------------------------------------------------------------

registerEvent({
  name: "ceo-scandal.press-conference",
  description: "CEO addresses allegations, outcome decided",
  schema: ChainSchema,
  handler: async (ctx, meta) => {
    const entities: ContentEntity[] = [
      { text: meta.companyName, type: "company" },
      { text: meta.ticker, type: "ticker" },
      { text: meta.ceoName, type: "person" },
    ];

    if (meta.willResign) {
      const interimCeo = await ctx.run("interim-ceo", () => randomName());

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

      await Promise.all([
        ctx.run("news-tweet", async () => {
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
        }),
        ctx.run("celebration-tweet", async () => {
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
        }),
      ]);

      // CEO resignation: sector goes volatile + drops 8-12%
      await ctx.run("market-impact", async () => {
        const company = COMPANIES.find((c) => c.id === meta.companyId);
        if (!company || company.sectors.length === 0) return;
        const sectorId = company.sectors[0].sectorId;
        await market.updateSectorStatus(sectorId, "volatile");
        const { getSectorIndex } = await import("../state");
        const currentIndex = await getSectorIndex(sectorId);
        const drop = 8 + Math.random() * 4; // 8-12%
        await market.updateSectorIndex(sectorId, currentIndex * (1 - drop / 100));
      });
    } else {
      await Promise.all([
        ctx.run("survived-news", async () => {
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
        }),
        ctx.run("survived-tweet", async () => {
          const shitposters = getPersonasByType("shitposter");
          if (shitposters.length === 0) return;
          const persona = pickRandom(shitposters);
          await tweets.write({
            authorId: persona.id, authorHandle: persona.handle,
            authorDisplayName: persona.displayName,
            content: `${meta.ceoName} SURVIVED the ${meta.scandalShort} scandal?? only in this timeline 💀`,
            eventChainId: meta.chainId, entities,
          });
        }),
      ]);
    }

    await ctx.run("finish-chain", () => removeActiveChain(meta.chainId));
    return { followUpEvents: [] };
  },
});
