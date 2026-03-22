import { z } from "zod";
import { registerSeedEvent } from "../registry";
import { tweets } from "@/lib/tweets";
import { PERSONAS, getPersonasByType } from "@/lib/simulation/personas";
import { pickRandom } from "@/lib/simulation/world";
import { generateTweetContent } from "@/lib/events/templates/tweets";

const NoiseSchema = z.object({});

registerSeedEvent({
  name: "noise.random-tweet",
  description: "A persona tweets something unrelated to any chain",
  schema: NoiseSchema,
  weight: 10,
  cooldownSeconds: 15,
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

    return { followUpEvents: [] };
  },
});
