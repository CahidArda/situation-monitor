import { nanoid } from "nanoid";
import { redis } from "./redis";
import { getDMIndex } from "./search";
import { getPersona } from "./simulation/personas";
import { DM_TTL_SECONDS } from "@/lib/constants";
import type { DirectMessage, DMConversation, DMType, DMMetadata } from "./interfaces/types";
import type { DMInterface } from "./interfaces/dms";

const index = getDMIndex();

export const dms: DMInterface = {
  async send({ fromPersonaId, content, type, entities, metadata }) {
    const persona = getPersona(fromPersonaId);

    const dm: DirectMessage = {
      id: nanoid(),
      fromPersonaId,
      fromHandle: persona?.handle ?? `@${fromPersonaId}`,
      fromDisplayName: persona?.displayName ?? fromPersonaId,
      content,
      timestamp: Date.now(),
      type,
      entities,
      metadata,
    };

    await redis.json.set(`dm:${dm.id}`, "$", dm);
    await redis.expire(`dm:${dm.id}`, DM_TTL_SECONDS);
    return dm;
  },

  async listConversations(params) {
    const cutoff = Math.max(Date.now() - DM_TTL_SECONDS * 1000, params?.afterTs ?? 0);
    const results = await index.query({
      filter: { timestamp: { $gt: cutoff } },
      orderBy: { timestamp: "DESC" },
      limit: 200,
    });

    const seen = new Map<string, DMConversation>();

    for (const r of results) {
      const dm = r.data as DirectMessage | undefined;
      if (!dm) continue;
      if (seen.has(dm.fromPersonaId)) continue;

      seen.set(dm.fromPersonaId, {
        personaId: dm.fromPersonaId,
        personaHandle: dm.fromHandle,
        personaDisplayName: dm.fromDisplayName,
        lastMessage: dm.content,
        lastTimestamp: dm.timestamp,
      });
    }

    return [...seen.values()].sort(
      (a, b) => b.lastTimestamp - a.lastTimestamp,
    );
  },

  async listMessages(personaId, params) {
    const limit = params?.limit ?? 30;

    const cutoff = Math.max(Date.now() - DM_TTL_SECONDS * 1000, params?.afterTs ?? 0);
    const filters: Record<string, unknown>[] = [
      { fromPersonaId: { $eq: personaId } },
      { timestamp: { $gt: cutoff } },
    ];

    if (params?.beforeTs != null) {
      filters.push({ timestamp: { $lt: params.beforeTs } });
    }

    const filter = filters.length > 1 ? { $and: filters } : filters[0];

    const results = await index.query({
      filter,
      orderBy: { timestamp: "DESC" },
      limit: limit + 1,
    });

    const hasMore = results.length > limit;
    const page = hasMore ? results.slice(0, limit) : results;

    const messages: DirectMessage[] = page
      .map((r) => r.data as DirectMessage | undefined)
      .filter((m): m is DirectMessage => m != null);

    return { messages, hasMore };
  },
};
