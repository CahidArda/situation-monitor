import { NextRequest, NextResponse } from "next/server";
import { news } from "@/lib/news";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;

  const result = await news.list({
    afterTs: params.get("afterTs") ? Number(params.get("afterTs")) : undefined,
    beforeTs: params.get("beforeTs") ? Number(params.get("beforeTs")) : undefined,
    limit: params.get("limit") ? Number(params.get("limit")) : undefined,
    category: params.get("category") ?? undefined,
    search: params.get("search") ?? undefined,
  });

  return NextResponse.json(result);
}
