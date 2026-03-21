import { NextRequest, NextResponse } from "next/server";
import { tweets } from "@/lib/tweets";

export async function GET(req: NextRequest) {
  const afterTs = req.nextUrl.searchParams.get("afterTs");

  if (!afterTs) {
    return NextResponse.json({ error: "afterTs is required" }, { status: 400 });
  }

  const count = await tweets.getNewCount(Number(afterTs));
  return NextResponse.json({ count });
}
