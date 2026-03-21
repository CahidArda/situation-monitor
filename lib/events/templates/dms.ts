import type { DMType } from "@/lib/interfaces/types";

// ---------------------------------------------------------------------------
// Typed params for each DM event type
// ---------------------------------------------------------------------------

export type InsiderTradingDMParams = {
  company: string;
  ticker: string;
  prediction: string;
  direction: string;
  department: string;
  percent: string;
  amount: string;
  sector: string;
};

export type MarketManipulationDMParams = {
  company: string;
  ticker: string;
  announcement: string;
};

export type GeneralDMParams = {
  sector: string;
  ticker: string;
};

// ---------------------------------------------------------------------------
// Event type union & params map
// ---------------------------------------------------------------------------

export type DMEventType =
  | "insider-trading"
  | "market-manipulation"
  | "general";

type DMEventParams = {
  "insider-trading": InsiderTradingDMParams;
  "market-manipulation": MarketManipulationDMParams;
  "general": GeneralDMParams;
};

type DMTemplate<P> = (p: P) => string;

// ---------------------------------------------------------------------------
// Template definitions
// ---------------------------------------------------------------------------

const dmTemplates: {
  [E in DMEventType]: Partial<Record<DMType, DMTemplate<DMEventParams[E]>[]>>;
} = {
  "insider-trading": {
    tip: [
      (p) =>
        `Hey... you didn't hear this from me, but ${p.company} is about to ${p.prediction}. My cousin works in their ${p.department}. Just saying. 👀`,
      (p) =>
        `I have it on VERY good authority that ${p.ticker} is going to ${p.direction} big time. Don't ask how I know.`,
      (p) =>
        `Bro. BRO. Load up on ${p.ticker}. Trust me on this one. Something HUGE is coming. I literally cannot say more.`,
      (p) =>
        `${p.ticker}. This week. You'll thank me later. 🤫`,
    ],
    followup: [
      (p) =>
        `Did you see ${p.ticker}?? I TOLD you. You owe me a coffee ☕`,
      (p) =>
        `So... about that ${p.ticker} tip... I may have been slightly wrong. My bad 😬`,
      (p) =>
        `${p.ticker} did exactly what I said it would. Am I a prophet? Probably.`,
    ],
    brag: [
      (p) =>
        `Made ${p.amount} on that ${p.ticker} play. I'm literally a genius.`,
      (p) =>
        `That's 5 in a row I've called correctly. They should give me a Bloomberg terminal.`,
      (p) =>
        `My ${p.ticker} position is UP ${p.percent}%. Just thought you should know 😎`,
    ],
    panic: [
      (p) =>
        `OK so ${p.ticker} did not go the direction I said. I am absolutely NOT panicking right now. Everything is fine. 🔥`,
      (p) =>
        `I may have lost everything on ${p.ticker}. If anyone asks, I was never here.`,
      (p) =>
        `bro I'm so cooked. ${p.ticker} just ${p.direction}ed ${p.percent}% and I was on the wrong side. my wife is going to kill me`,
      (p) =>
        `DO NOT check ${p.ticker} right now. Actually, don't check anything. Go outside. Touch grass.`,
    ],
    casual: [
      (p) =>
        `What do you think about ${p.sector} right now? I'm seeing some interesting moves.`,
      (p) =>
        `You watching the ${p.sector} sector? Something feels off.`,
      (p) =>
        `Quiet day in ${p.sector}. Almost too quiet... 🤔`,
    ],
  },

  "market-manipulation": {
    tip: [
      (p) =>
        `Listen... I know a guy who knows a guy at ${p.company}. They're about to announce ${p.announcement}. This is going to move the needle BIG time.`,
      (p) =>
        `I'm going ALL IN on ${p.ticker} tomorrow morning. Going to tweet about it too. Just giving you a heads up first 😉`,
      (p) =>
        `Between you and me: ${p.ticker} is about to have a very good week. Very good.`,
    ],
    followup: [
      (p) =>
        `Posted my ${p.ticker} tweet. Let's see if the crowd follows. 🐑`,
      (p) =>
        `${p.ticker} is moving!! The sheep are buying!! 🐑📈`,
    ],
    panic: [
      (p) =>
        `So the authorities may be looking into my ${p.ticker} posts. If they ask, we never spoke.`,
      (p) =>
        `DELETE YOUR MESSAGES ABOUT ${p.ticker}. Actually wait, does this app even have that feature? Oh no.`,
      (p) =>
        `I need to lay low for a while. If anyone asks about ${p.ticker}, you don't know me.`,
    ],
  },

  "general": {
    casual: [
      (p) =>
        `Markets are wild today. What are you holding in ${p.sector}?`,
      (p) =>
        `Keep your eyes open this week. That's all I'll say. 👀`,
      () =>
        `Interesting times ahead. Very interesting times.`,
      () =>
        `You seem like someone who knows how to monitor a situation. Respect. 🫡`,
      (p) =>
        `I've been watching ${p.ticker} for a while now. No tips, just... watching. 👁️`,
    ],
    tip: [
      (p) =>
        `Not financial advice, but... look at ${p.ticker}. Just look at it.`,
      (p) =>
        `I can't say much, but ${p.sector} is about to get very interesting.`,
    ],
  },
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function generateDMContent<E extends DMEventType>(
  eventType: E,
  dmType: DMType,
  params: DMEventParams[E],
): string {
  const byType = dmTemplates[eventType]?.[dmType];
  const templates = (byType ?? []) as DMTemplate<DMEventParams[E]>[];
  if (templates.length === 0) {
    return `Something's happening in the market. Stay sharp.`;
  }
  const template = templates[Math.floor(Math.random() * templates.length)];
  return template(params);
}

export function getDMEventTypes(): DMEventType[] {
  return Object.keys(dmTemplates) as DMEventType[];
}
