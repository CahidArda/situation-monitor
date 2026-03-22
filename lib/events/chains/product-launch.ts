import { z } from "zod";
import { nanoid } from "nanoid";
import { registerSeedEvent, registerEvent } from "../registry";
import { addActiveChain, removeActiveChain, getActiveChainCount, getSectorIndex } from "../state";
import { tweets } from "@/lib/tweets";
import { news } from "@/lib/news";
import { COMPANIES } from "@/lib/market/companies";
import { market } from "@/lib/market/market";
import { getPersonasByType } from "@/lib/simulation/personas";
import { pickRandom, RIDICULOUS_PRODUCTS } from "@/lib/simulation/world";
import { randomName } from "@/lib/simulation/names";
import { generateTweetContent } from "../templates/tweets";
import type { ContentEntity } from "@/lib/interfaces/types";

const ChainSchema = z.object({
  chainId: z.string(),
  companyName: z.string(),
  ticker: z.string(),
  product: z.string(),
  isHit: z.boolean(),
});

type ChainMeta = z.infer<typeof ChainSchema>;

// 1. Seed → announcement
registerSeedEvent({
  name: "product-launch.setup",
  description: "Start a product launch chain",
  schema: z.object({}),
  weight: 4,
  cooldownSeconds: 150,
  requiredConditions: async () => (await getActiveChainCount()) < 3,
  handler: async (ctx) => {
    const meta = await ctx.run("setup-meta", async () => {
      const company = pickRandom(COMPANIES);
      const chainId = `product-${nanoid(6)}`;
      await addActiveChain(chainId);
      return {
        chainId,
        companyName: company.name,
        ticker: company.ticker,
        product: pickRandom(RIDICULOUS_PRODUCTS),
        isHit: Math.random() < 0.4,
      } satisfies ChainMeta;
    });
    return {
      followUpEvents: [
        { eventName: "product-launch.announcement", metadata: meta },
      ],
    };
  },
});

// 2. Announcement → reactions (15-25s)
registerEvent({
  name: "product-launch.announcement",
  description: "Company announces the product",
  schema: ChainSchema,
  handler: async (ctx, meta) => {
    const entities: ContentEntity[] = [
      { text: meta.companyName, type: "company" },
      { text: meta.ticker, type: "ticker" },
      { text: meta.product, type: "commodity" },
    ];

    await Promise.all([
      ctx.run("announcement-news", async () => {
        const newsPersonas = getPersonasByType("news");
        if (newsPersonas.length === 0) return;
        const org = pickRandom(newsPersonas);
        const analystName = randomName();
        await news.write({
          headline: `${meta.companyName} Unveils ${meta.product} to Mixed Reactions`,
          summary: `${meta.companyName} (${meta.ticker}) announced its latest product. Industry observers are divided.`,
          body: `${meta.companyName} surprised markets today with the announcement of its newest offering: ${meta.product}.\n\n"This is either brilliant or completely insane," said ${analystName}, an industry analyst. "Possibly both."\n\n${meta.ticker} shares moved on the news as investors tried to determine whether ${meta.product} represents genuine innovation or a late-night fever dream from the C-suite.`,
          category: "business",
          source: org.id,
          sourceDisplayName: org.displayName,
          entities: [...entities, { text: analystName, type: "person" as const }],
        });
      }),
      ctx.run("official-tweet", async () => {
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
        });
      }),
    ]);

    const delay = await ctx.run("delay", () => 15 + Math.floor(Math.random() * 10));
    return {
      followUpEvents: [
        { eventName: "product-launch.reaction-wave", metadata: meta, delaySeconds: delay },
      ],
    };
  },
});

// 3. Reaction wave → outcome (20-30s)
registerEvent({
  name: "product-launch.reaction-wave",
  description: "People react to the product",
  schema: ChainSchema,
  handler: async (ctx, meta) => {
    const entities: ContentEntity[] = [
      { text: meta.companyName, type: "company" },
      { text: meta.product, type: "commodity" },
    ];

    await Promise.all([
      ctx.run("shitpost-reaction", async () => {
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
          entities,
        });
      }),
      ctx.run("regular-reaction", async () => {
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
          entities,
        });
      }),
      ctx.run("analyst-reaction", async () => {
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
          entities,
        });
      }),
    ]);

    const delay = await ctx.run("delay", () => 20 + Math.floor(Math.random() * 10));
    return {
      followUpEvents: [
        { eventName: "product-launch.outcome", metadata: meta, delaySeconds: delay },
      ],
    };
  },
});

// 4. Outcome — hit or flop
registerEvent({
  name: "product-launch.outcome",
  description: "Product is a hit or a flop",
  schema: ChainSchema,
  handler: async (ctx, meta) => {
    const entities: ContentEntity[] = [
      { text: meta.companyName, type: "company" },
      { text: meta.ticker, type: "ticker" },
      { text: meta.product, type: "commodity" },
    ];

    const impactPercent = await ctx.run("calc-impact", () => 1 + Math.random() * 2); // 1-3%

    if (meta.isHit) {
      await Promise.all([
        ctx.run("hit-news", async () => {
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
        }),
        ctx.run("hit-tweet", async () => {
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
        }),
      ]);

      await ctx.run("market-impact", async () => {
        const company = COMPANIES.find((c) => c.name === meta.companyName);
        if (!company || company.sectors.length === 0) return;
        const sectorId = company.sectors[0].sectorId;
        const currentIndex = await getSectorIndex(sectorId);
        await market.updateSectorIndex(sectorId, currentIndex * (1 + impactPercent / 100));
      });
    } else {
      await Promise.all([
        ctx.run("flop-news", async () => {
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
        }),
        ctx.run("flop-tweet", async () => {
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
        }),
      ]);

      await ctx.run("market-impact", async () => {
        const company = COMPANIES.find((c) => c.name === meta.companyName);
        if (!company || company.sectors.length === 0) return;
        const sectorId = company.sectors[0].sectorId;
        const currentIndex = await getSectorIndex(sectorId);
        await market.updateSectorIndex(sectorId, currentIndex * (1 - impactPercent / 100));
      });
    }

    await ctx.run("finish-chain", () => removeActiveChain(meta.chainId));
    return { followUpEvents: [] };
  },
});
