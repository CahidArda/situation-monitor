import type { SeedEventDefinition } from "@/lib/interfaces/events";
import { tweets } from "@/lib/tweets";
import { PERSONAS, getPersona, getPersonasByType } from "@/lib/simulation/personas";
import { pickRandom } from "@/lib/simulation/world";
import { generateTweetContent } from "@/lib/events/templates/tweets";
import { COOLDOWN_TICKS } from "@/lib/constants";

export const noiseTweet: SeedEventDefinition = {
  name: "noise.random-tweet",
  description: "A persona tweets something unrelated to any chain",
  weight: 4,
  cooldownTicks: COOLDOWN_TICKS["noise"],
  handler: async (ctx) => {
    await ctx.run("noise-tweet", async () => {
      const personaTypes = ["shitposter", "analyst", "regular", "insider"] as const;
      const type = pickRandom(personaTypes);
      const personas = getPersonasByType(type);
      const persona = personas.length > 0 ? pickRandom(personas) : pickRandom(PERSONAS);

      const content = generateTweetContent("noise", persona.type, {} as Record<string, never>);

      await tweets.write({
        authorId: persona.id,
        authorHandle: persona.handle,
        authorDisplayName: persona.displayName,
        content,
      });
    });
  },
};

// Easter egg: time-traveling trader from 1492
const TIME_TRAVELER_TWEETS = [
  "What manner of sorcery is this 'stock market'? In my day we traded spices and silks like civilized merchants.",
  "I have traveled from the year 1492 and I must say, your 'fish futures' are far inferior to actual fish.",
  "They told me to 'buy the dip.' I purchased an entire barrel of olive oil. Was this not correct?",
  "In Venice we simply drowned our financial advisors in the canal. You moderns are too soft.",
  "I do not understand your 'blockchain' but it sounds like something a blacksmith would make. I approve.",
  "Your 'ETFs' remind me of the communal grain stores we had. Except somehow worse.",
  "Why does everyone speak of 'bears' and 'bulls'? I have seen both at the market in Constantinople. Neither purchased stocks.",
  "A merchant in my time who lost this much gold would have been banished to sea. You call it 'Tuesday.'",
];

// Easter egg: Yoda the market sage
const YODA_TWEETS = [
  "Buy the dip, you must. Sell high, you will. Patience, a Jedi investor requires.",
  "Strong with the Force, this sector is. But cloud the future, volatility does.",
  "Fear leads to selling. Selling leads to loss. Loss leads to suffering. Hold, you must.",
  "Much to learn, you still have. The market, a great teacher it is. Expensive too.",
  "Hmm. Green candles, I see. Red candles also. Unclear, the chart is.",
  "Do or do not buy this dip. There is no 'limit order.'",
  "A great disturbance in the market, I feel. As if millions of portfolios cried out in terror.",
  "Judge a stock by its ticker, do not. Judge it by its fundamentals, you should. Read them, I have not.",
  "When 900 years of trading experience you have, look this good your portfolio will not.",
  "The dark side of leverage, beware. Quick gains it promises. Margin calls it delivers.",
];

export const yodaTrader: SeedEventDefinition = {
  name: "noise.yoda-trader",
  description: "Yoda dispenses cryptic market wisdom",
  weight: 1,
  cooldownTicks: COOLDOWN_TICKS["yoda-trader"],
  handler: async (ctx) => {
    await ctx.run("yoda-tweet", async () => {
      const persona = getPersona("yoda-trader");
      if (!persona) return;
      await tweets.write({
        authorId: persona.id,
        authorHandle: persona.handle,
        authorDisplayName: persona.displayName,
        content: pickRandom(YODA_TWEETS),
      });
    });
  },
};

export const timeTraveler: SeedEventDefinition = {
  name: "noise.time-traveler",
  description: "The time-traveling Venetian merchant tweets",
  weight: 1, // rare
  cooldownTicks: COOLDOWN_TICKS["time-traveler"],
  handler: async (ctx) => {
    await ctx.run("time-traveler-tweet", async () => {
      const persona = getPersona("time-traveler");
      if (!persona) return;

      const content = pickRandom(TIME_TRAVELER_TWEETS);

      await tweets.write({
        authorId: persona.id,
        authorHandle: persona.handle,
        authorDisplayName: persona.displayName,
        content,
      });
    });
  },
};
