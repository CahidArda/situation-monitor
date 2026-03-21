import { NextRequest, NextResponse } from "next/server";
import { dms } from "@/lib/dms";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ personaId: string }> },
) {
  const { personaId } = await params;
  const sp = req.nextUrl.searchParams;

  const result = await dms.listMessages(personaId, {
    limit: sp.get("limit") ? Number(sp.get("limit")) : undefined,
    beforeTs: sp.get("beforeTs") ? Number(sp.get("beforeTs")) : undefined,
  });

  return NextResponse.json(result);
}
