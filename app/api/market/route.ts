import { NextResponse } from "next/server";
import { market } from "@/lib/market/market";

export async function GET() {
  const data = await market.getPrices();
  return NextResponse.json(data);
}
