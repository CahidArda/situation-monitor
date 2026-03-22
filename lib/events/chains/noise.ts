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
