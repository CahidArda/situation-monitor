import { NextRequest, NextResponse } from "next/server";
import { dms } from "@/lib/dms";

export async function GET(req: NextRequest) {
  const afterTs = req.nextUrl.searchParams.get("afterTs");
  const conversations = await dms.listConversations({
    afterTs: afterTs ? Number(afterTs) : undefined,
  });
  return NextResponse.json({ conversations });
}
