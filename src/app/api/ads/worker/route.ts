import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

const ONLINE_MS = 2 * 60_000;

/**
 * GET /api/ads/worker — is the PC render worker alive, and how many runs wait
 * for it? Polled by n8n WF4 every 10 minutes.
 * Auth: x-n8n-secret (or admin cookie), enforced in src/proxy.ts.
 */
export async function GET() {
  const db = getDb();
  if (!db) return NextResponse.json({ error: "No database connected." }, { status: 503 });
  const [beat, waiting] = await Promise.all([
    db.from("worker_heartbeat").select("worker_last_seen").eq("id", "render-worker").maybeSingle(),
    db.from("ad_runs").select("id", { count: "exact", head: true }).eq("status", "waiting_render"),
  ]);
  if (waiting.error) return NextResponse.json({ error: waiting.error.message }, { status: 500 });
  const lastSeen = beat.data?.worker_last_seen ?? null;
  const online = lastSeen !== null && Date.now() - new Date(lastSeen).getTime() < ONLINE_MS;
  return NextResponse.json({ online, lastSeen, waiting: waiting.count ?? 0 });
}
