import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { market } from "@/lib/market/market";
import crypto from "crypto";

const CACHE_TTL = 10; // seconds

type HistoryQuery = { type: "company" | "sector" | "commodity" | "global"; id: string };

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const lastN = sp.get("lastN") ? Number(sp.get("lastN")) : 50;

  // Support batch: ?q=company:abc,sector:tech,global:global
  // Or single: ?type=company&id=abc
  const qParam = sp.get("q");
  const queries: HistoryQuery[] = [];

  if (qParam) {
    for (const part of qParam.split(",")) {
      const [type, id] = part.split(":");
      if (type && id) {
        queries.push({ type: type as HistoryQuery["type"], id });
      }
    }
  } else {
    const type = sp.get("type") as HistoryQuery["type"];
    const id = sp.get("id") ?? "";
    if (type) queries.push({ type, id });
  }

  if (queries.length === 0) {
    return NextResponse.json({ error: "No queries provided" }, { status: 400 });
  }

  // Build cache key from all queries
  const queryStr = queries.map((q) => `${q.type}:${q.id}`).join(",");
  const cacheKey = `cache:market:history:${crypto.createHash("md5").update(`${queryStr}:${lastN}`).digest("hex")}`;

  const cached = await redis.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  // Fetch all in parallel
  const results = await Promise.all(
    queries.map((q) => market.getPriceHistory({ ...q, lastN })),
  );

  // Single query returns array directly, batch returns keyed map
  if (queries.length === 1) {
    await redis.set(cacheKey, JSON.stringify(results[0]), { ex: CACHE_TTL });
    return NextResponse.json(results[0]);
  }

  const response: Record<string, Array<{ tick: number; price: number }>> = {};
  queries.forEach((q, i) => {
    const key = q.type === "global" ? "global" : `${q.type}:${q.id}`;
    response[key] = results[i];
  });

  await redis.set(cacheKey, JSON.stringify(response), { ex: CACHE_TTL });
  return NextResponse.json(response);
}
