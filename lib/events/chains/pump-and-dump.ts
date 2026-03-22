import { nanoid } from "nanoid";
import type { SeedEventDefinition } from "@/lib/interfaces/events";
import { addActiveChain, removeActiveChain, getActiveChainCount } from "../state";
import { tweets } from "@/lib/tweets";
import { dms } from "@/lib/dms";
import { news } from "@/lib/news";
import { COMPANIES } from "@/lib/market/companies";
import { applyMarketImpact, getCompanySectorIdByName } from "@/lib/market/impact";
import { DM_PERSONAS, getPersona, getPersonasByType } from "@/lib/simulation/personas";
import { pickRandom } from "@/lib/simulation/world";
import { generateTweetContent } from "../templates/tweets";
import { generateDMContent } from "../templates/dms";
import { generateNewsArticle } from "../templates/news";
import { ticksToSeconds, COOLDOWN_TICKS } from "@/lib/constants";
import type { ContentEntity } from "@/lib/interfaces/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChainMeta {
  chainId: string;
  companyName: string;
  ticker: string;
  manipulatorId: string;
}

// ---------------------------------------------------------------------------
// Chain
// ---------------------------------------------------------------------------

export const pumpAndDump: SeedEventDefinition = {
  name: "pump-and-dump.setup",
  description: "Start a pump and dump scheme",
  weight: 3,
  cooldownTicks: COOLDOWN_TICKS["pump-and-dump"],
  requiredConditions: async () => (await getActiveChainCount()) < 3,
  handler: async (ctx) => {
    // ── Step 1: Setup metadata ──────────────────────────────────────────
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

    // ── Step 2: Insider DM ──────────────────────────────────────────────
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

    const delay1 = await ctx.run("delay-1", () => 1 + Math.floor(Math.random() * 2));
    await ctx.sleep("after-dm", ticksToSeconds(delay1));

    // ── Step 3: Hype tweets ─────────────────────────────────────────────
    const entities: ContentEntity[] = [
      { text: meta.ticker, type: "ticker" },
      { text: meta.companyName, type: "company" },
    ];
    const manipulator = getPersona(meta.manipulatorId);

    await ctx.run("manipulator-tweet", async () => {
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
    });

    await ctx.run("fomo-tweet", async () => {
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
    });

    await ctx.run("followup-dm", async () => {
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
    });

    const delay2 = await ctx.run("delay-2", () => 2 + Math.floor(Math.random() * 3));
    await ctx.sleep("after-hype", ticksToSeconds(delay2));

    // ── Step 4: Dump ────────────────────────────────────────────────────
    const dropPercent = await ctx.run("calc-drop", () => Math.floor(Math.random() * 15 + 10)); // 10-25%

    // Apply the drop to the sector
    const sectorId = getCompanySectorIdByName(meta.companyName);
    if (sectorId) {
      await applyMarketImpact(ctx, sectorId, -dropPercent, "volatile");
    }

    // Crash news
    await ctx.run("crash-news", async () => {
      const newsPersonas = getPersonasByType("news");
      if (newsPersonas.length === 0) return;
      const org = pickRandom(newsPersonas);
      const article = generateNewsArticle("regulatory-investigation", {
        company: meta.companyName,
        ticker: meta.ticker,
        percent: String(dropPercent),
        detail: 'Regulators have announced they are investigating "coordinated activity" on social media that appeared to drive the initial price increase.',
      });
      await news.write({
        ...article,
        source: org.id,
        sourceDisplayName: org.displayName,
        entities,
      });
    });

    // Bagholders tweet
    await ctx.run("bagholders-tweet", async () => {
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
    });

    // Manipulator panic DM
    await ctx.run("manipulator-dm", async () => {
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
    });

    // Analyst tweet
    await ctx.run("analyst-tweet", async () => {
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
    });

    await ctx.run("finish-chain", () => removeActiveChain(meta.chainId));
  },
};
