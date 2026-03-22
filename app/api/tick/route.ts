import { NextResponse } from "next/server";
import { Client } from "@upstash/qstash";
import { getLastEventTime, setLastEventTime } from "@/lib/events/state";

const EVENT_COOLDOWN_MS = 60_000; // 1 minute between events

export async function POST() {
  const lastEventTime = await getLastEventTime();
  const elapsed = Date.now() - lastEventTime;

  if (elapsed < EVENT_COOLDOWN_MS) {
    return NextResponse.json({
      status: "event-not-started",
      nextIn: Math.ceil((EVENT_COOLDOWN_MS - elapsed) / 1000),
    });
  }

  // Mark time immediately to prevent double-triggers from concurrent requests
  await setLastEventTime();

  // Trigger the workflow
  const qstash = new Client({ token: process.env.QSTASH_TOKEN! });

  const baseUrl =
    process.env.UPSTASH_WORKFLOW_URL ??
    process.env.VERCEL_URL ??
    "http://localhost:3000";

  const workflowUrl = `${baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`}/api/workflow`;

  await qstash.publishJSON({
    url: workflowUrl,
    body: { type: "seed" },
  });

  return NextResponse.json({ status: "event-started" });
}
