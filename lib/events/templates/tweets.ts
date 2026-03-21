import type { PersonaType } from "@/lib/interfaces/types";

type TweetTemplate = (p: Record<string, string>) => string;

export type TweetEventType =
  | "stock-rises"
  | "stock-falls"
  | "ceo-scandal"
  | "sector-boom"
  | "sector-crash"
  | "diplomatic-incident"
  | "product-launch"
  | "insider-rumor"
  | "insider-correct"
  | "insider-wrong"
  | "noise"
  | "arrest";

/** Templates keyed by event type → persona type → array of template functions. */
const tweetTemplates: Record<TweetEventType, Partial<Record<PersonaType, TweetTemplate[]>>> = {
  // ── Stock price movement ─────────────────────────────────────────────
  "stock-rises": {
    analyst: [
      (p) =>
        `${p.company} up ${p.percent}% today. Called it last week. You're welcome. 📈`,
      (p) =>
        `If you're not in ${p.ticker} right now, I don't know what to tell you.`,
      (p) =>
        `${p.ticker} breaking resistance levels. My target was ${p.percent}% and we're not done.`,
    ],
    shitposter: [
      (p) => `${p.ticker} TO THE MOON 🚀🚀🚀 MY LANDLORD CAN WAIT`,
      (p) =>
        `me watching my ${p.ticker} position print money while my ex said I was "financially irresponsible" 😂`,
      (p) => `LETS GOOOOO ${p.ticker} 📈📈📈 I MIGHT ACTUALLY PAY RENT THIS MONTH`,
    ],
    news: [
      (p) =>
        `MARKETS: ${p.company} (${p.ticker}) shares rise ${p.percent}% following ${p.reason}`,
      (p) =>
        `${p.ticker} up ${p.percent}% in midday trading. ${p.company} ${p.reason}.`,
    ],
    regular: [
      (p) => `wait ${p.ticker} is up ${p.percent}%?? I sold that last week 😭`,
      (p) => `my coworker won't shut up about ${p.ticker}. maybe I should buy some??`,
    ],
  },

  "stock-falls": {
    analyst: [
      (p) =>
        `${p.company} down ${p.percent}%. If you followed my advice, you were already out. If not... 🤷`,
      (p) => `${p.ticker} correction was inevitable. Fundamentals don't lie.`,
    ],
    shitposter: [
      (p) =>
        `${p.ticker} is CRASHING and I'm holding 🔥🔥🔥 this is fine everything is fine`,
      (p) => `RIP to everyone who bought ${p.ticker} at the top. including me.`,
      (p) =>
        `my portfolio just filed for emotional distress after that ${p.ticker} drop`,
    ],
    news: [
      (p) =>
        `${p.company} (${p.ticker}) shares fall ${p.percent}% amid ${p.reason}`,
    ],
    regular: [
      (p) => `should I be worried about ${p.ticker}? asking for a friend (the friend is me)`,
    ],
  },

  // ── CEO scandal ──────────────────────────────────────────────────────
  "ceo-scandal": {
    regular: [
      (p) =>
        `Wait the CEO of ${p.company} really quit because ${p.reason}?? 💀`,
      (p) =>
        `${p.company} CEO drama is the funniest thing I've seen all week`,
      (p) =>
        `imagine explaining to shareholders that your CEO left because of "${p.reason}"`,
    ],
    shitposter: [
      (p) =>
        `${p.company} CEO be like: ${p.reason}\n\nBoard: 👁️👄👁️`,
      (p) =>
        `POV: you're the ${p.company} board watching your CEO ${p.reason} during earnings call`,
      (p) =>
        `${p.company} CEO speedrunning career destruction any% 💀`,
    ],
    analyst: [
      (p) =>
        `${p.company} CEO departure creates uncertainty. Watching for board response. Key support at ${p.price}.`,
      (p) =>
        `The ${p.company} CEO situation is a textbook example of governance risk. Adjusting my price target.`,
    ],
    news: [
      (p) =>
        `BREAKING: ${p.company} CEO ${p.ceoName} faces pressure after ${p.reason}. Board meeting scheduled.`,
      (p) =>
        `${p.company} shares volatile as CEO ${p.ceoName} controversially ${p.reason}`,
    ],
  },

  // ── Sector movement ──────────────────────────────────────────────────
  "sector-boom": {
    analyst: [
      (p) =>
        `${p.sector} sector entering a bull phase. Here's my thesis (thread):\n\n1/ ${p.reason}`,
      (p) =>
        `Rotating into ${p.sector}. The macro setup is textbook bullish.`,
    ],
    news: [
      (p) =>
        `SECTOR WATCH: ${p.sector} index up ${p.percent}% as ${p.reason}`,
    ],
    shitposter: [
      (p) =>
        `${p.sector} SECTOR GO BRRRRR 🚀🚀🚀`,
      (p) =>
        `everyone who said ${p.sector} was dead: 🤡🤡🤡`,
    ],
  },

  "sector-crash": {
    analyst: [
      (p) =>
        `${p.sector} sector entering bear territory. Reducing exposure immediately.`,
      (p) =>
        `Called the ${p.sector} downturn two weeks ago. Thread incoming on where it goes from here.`,
    ],
    news: [
      (p) =>
        `SECTOR ALERT: ${p.sector} index drops ${p.percent}% following ${p.reason}`,
    ],
    shitposter: [
      (p) => `${p.sector} is absolutely COOKED right now 💀`,
      (p) =>
        `poured one out for everyone holding ${p.sector} stocks rn 🪦`,
    ],
  },

  // ── Diplomatic incident ──────────────────────────────────────────────
  "diplomatic-incident": {
    news: [
      (p) =>
        `BREAKING: Tensions escalate between ${p.country1} and ${p.country2} over ${p.issue}. Markets react.`,
      (p) =>
        `${p.country1}-${p.country2} dispute over ${p.issue} rattles investors. ${p.sector} sector most affected.`,
    ],
    analyst: [
      (p) =>
        `The ${p.country1}/${p.country2} situation has direct implications for ${p.sector}. Hedging accordingly.`,
    ],
    shitposter: [
      (p) =>
        `${p.country1} and ${p.country2} beefing over ${p.issue} is the most 2024 thing ever 💀`,
      (p) =>
        `markets when two countries argue about ${p.issue}: 📉📉📉\nme: 🍿`,
    ],
    regular: [
      (p) =>
        `wait why is everything red?? what did ${p.country1} do now`,
    ],
  },

  // ── Product launch ───────────────────────────────────────────────────
  "product-launch": {
    news: [
      (p) =>
        `${p.company} announces ${p.product}. Shares move ${p.direction} ${p.percent}%.`,
    ],
    analyst: [
      (p) =>
        `${p.company}'s new ${p.product} is either genius or insane. Maintaining my price target while I figure out which.`,
    ],
    shitposter: [
      (p) =>
        `${p.company} really said "you know what the world needs? ${p.product}" 😭😭`,
      (p) =>
        `the ${p.product} is either the future or the worst idea since my last trade. no in between.`,
    ],
    regular: [
      (p) =>
        `would anyone actually buy a ${p.product}? genuine question`,
      (p) =>
        `my dad just asked me what a "${p.product}" is and I have no answers`,
    ],
  },

  // ── Insider trading / rumors ─────────────────────────────────────────
  "insider-rumor": {
    insider: [
      (p) =>
        `Something big is happening with ${p.ticker}. Can't say more. 👀`,
      (p) =>
        `Y'all sleeping on ${p.ticker}. That's all I'm gonna say.`,
    ],
    regular: [
      (p) =>
        `why is everyone suddenly talking about ${p.ticker}? what do they know that I don't`,
      (p) =>
        `sus activity on ${p.ticker} today. anyone else seeing this?`,
    ],
    analyst: [
      (p) =>
        `Unusual options activity on ${p.ticker}. Something may be developing.`,
    ],
  },

  "insider-correct": {
    insider: [
      (p) =>
        `I TOLD you about ${p.ticker}. I literally told you. You're welcome. 😎`,
      (p) =>
        `That's another one for the track record. ${p.ticker} exactly as predicted.`,
    ],
    regular: [
      (p) =>
        `how did @${p.insiderHandle} know about ${p.ticker}?? seriously`,
      (p) =>
        `ok @${p.insiderHandle} is either a genius or has a time machine`,
    ],
  },

  "insider-wrong": {
    insider: [
      (p) =>
        `The market is RIGGED. ${p.ticker} should have gone ${p.direction}. This is manipulation.`,
    ],
    shitposter: [
      (p) =>
        `@${p.insiderHandle} absolutely COOKED on that ${p.ticker} call lmaooo 💀`,
      (p) =>
        `another day another blown call from @${p.insiderHandle}. never change king 👑🤡`,
    ],
  },

  // ── Noise / ambient tweets ───────────────────────────────────────────
  "noise": {
    shitposter: [
      () => `stocks are just astrology for men and I say this as someone who checks futures at 4am`,
      () => `my investment strategy is "vibes" and honestly it's outperforming most hedge funds`,
      () => `"buy low sell high" ok but what if I simply do the opposite every time`,
      () => `one day I will understand what a bond yield curve is. today is not that day.`,
      () => `just found out you can lose MORE than 100% of your investment. capitalism is wild.`,
    ],
    analyst: [
      () => `Markets looking quiet today. Building positions for next week.`,
      () => `Remember: time in the market beats timing the market. Unless you time it perfectly.`,
      () => `Reviewing my Q4 thesis. Some adjustments needed. Thread later today.`,
    ],
    regular: [
      () => `is it normal to check your portfolio 47 times a day or should I talk to someone`,
      () => `my financial advisor told me to diversify so I downloaded three different trading apps`,
      () => `I don't understand half the words on financial twitter but I nod along anyway`,
    ],
    insider: [
      () => `Keep your eyes open this week. That's all I'll say. 👀`,
      () => `Interesting times ahead. Very interesting times.`,
    ],
  },

  // ── Arrest / legal ───────────────────────────────────────────────────
  "arrest": {
    news: [
      (p) =>
        `BREAKING: ${p.personName} arrested on ${p.charges} charges. ${p.company} shares react.`,
    ],
    shitposter: [
      (p) =>
        `${p.personName} getting arrested is the plot twist none of us saw coming but all of us needed 💀`,
      (p) =>
        `LMAOOO ${p.personName} ACTUALLY GOT ARRESTED. this timeline is unmatched.`,
    ],
    regular: [
      (p) =>
        `wait ${p.personName} got ARRESTED?? I literally just bought ${p.ticker} 😭`,
    ],
  },
};

/**
 * Pick a random tweet template for the given event type and persona type,
 * fill in the params, and return the content string.
 */
export function generateTweetContent(
  eventType: TweetEventType,
  personaType: PersonaType,
  params: Record<string, string>,
): string {
  const templates = tweetTemplates[eventType]?.[personaType] ?? [];
  if (templates.length === 0) {
    return `Something happened with ${params.company ?? params.ticker ?? "the market"}`;
  }
  const template = templates[Math.floor(Math.random() * templates.length)];
  return template(params);
}

/**
 * List all known event types that have templates.
 */
export function getTemplateEventTypes(): TweetEventType[] {
  return Object.keys(tweetTemplates) as TweetEventType[];
}
