import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { market } from "@/lib/market/market";

const CACHE_KEY = "cache:market:prices";
const CACHE_TTL = 10; // seconds

export async function GET() {
  const cached = await redis.get(CACHE_KEY);
  if (cached) {
    return NextResponse.json(cached);
  }

  const data = await market.getPrices();
  await redis.set(CACHE_KEY, JSON.stringify(data), { ex: CACHE_TTL });
  return NextResponse.json(data);
}
