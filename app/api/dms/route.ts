import { NextResponse } from "next/server";
import { dms } from "@/lib/dms";

export async function GET() {
  const conversations = await dms.listConversations();
  return NextResponse.json({ conversations });
}
