import { NextRequest, NextResponse } from "next/server";
import { tweets } from "@/lib/tweets";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const afterTs = params.get("afterTs");
  const beforeTs = params.get("beforeTs");
  const limit = params.get("limit");

  const result = await tweets.list({
    afterTs: afterTs ? Number(afterTs) : undefined,
    beforeTs: beforeTs ? Number(beforeTs) : undefined,
    limit: limit ? Number(limit) : undefined,
    search: params.get("search") ?? undefined,
    authorId: params.get("authorId") ?? undefined,
  });

  return NextResponse.json(result);
}
