import { NextRequest, NextResponse } from "next/server";
import { market } from "@/lib/market/market";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const company = await market.getCompany(id);
  if (!company) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(company);
}
