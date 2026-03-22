import { NextRequest, NextResponse } from "next/server";
import { market } from "@/lib/market/market";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const type = sp.get("type") as "company" | "sector" | "commodity" | "global";
  const id = sp.get("id") ?? "";
  const lastN = sp.get("lastN") ? Number(sp.get("lastN")) : undefined;

  if (!type) {
    return NextResponse.json({ error: "type is required" }, { status: 400 });
  }

  const history = await market.getPriceHistory({ type, id, lastN });
  return NextResponse.json(history);
}
