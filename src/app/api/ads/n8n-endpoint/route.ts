import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

/**
 * POST /api/ads/n8n-endpoint { baseUrl } — n8n's tunnel-sync container reports
 * the current public n8n URL (the quick tunnel's changes on every restart).
 * notify.ts reads it, so no env change or redeploy is needed.
 * Auth: x-n8n-secret (or admin cookie), enforced in src/proxy.ts.
 */
export async function POST(request: Request) {
  const db = getDb();
  if (!db) return NextResponse.json({ error: "No database connected." }, { status: 503 });
  const body = (await request.json().catch(() => null)) as { baseUrl?: unknown } | null;
  const raw = typeof body?.baseUrl === "string" ? body.baseUrl : "";
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return NextResponse.json({ error: "baseUrl must be a URL." }, { status: 400 });
  }
  if (url.protocol !== "https:") return NextResponse.json({ error: "baseUrl must be https." }, { status: 400 });
  const { error } = await db
    .from("n8n_endpoint")
    .upsert({ id: "n8n", base_url: url.origin, updated_at: new Date().toISOString() });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ baseUrl: url.origin });
}
