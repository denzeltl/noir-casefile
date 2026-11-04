import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import type { AdBrief } from "@/lib/ads/brief";

const SITE = () => (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

/**
 * GET /api/ads/alerts/cases — cases n8n hasn't sent to Telegram yet (alerted_at
 * is null), newest first, spoiler-free fields only. Feeds the catch-up digest.
 * Auth: x-n8n-secret (or admin cookie), enforced in src/proxy.ts.
 */
export async function GET() {
  const db = getDb();
  if (!db) return NextResponse.json({ error: "No database connected." }, { status: 503 });
  const { data, error } = await db
    .from("cases")
    .select("id, created_at, difficulty, brief_json, ad_runs(id)")
    .is("alerted_at", null)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const cases = data.map((c) => {
    const brief = c.brief_json as AdBrief;
    return {
      caseId: c.id,
      title: brief.title,
      setting: brief.setting,
      difficulty: c.difficulty,
      createdAt: c.created_at,
      hasAd: (c.ad_runs as unknown[]).length > 0,
    };
  });
  return NextResponse.json({ count: cases.length, cases, adminUrl: `${SITE()}/admin` });
}

const MarkSchema = z.object({ caseIds: z.array(z.string().min(1)).min(1).max(200) });

/** POST /api/ads/alerts/cases { caseIds } — n8n marks cases as alerted after sending. */
export async function POST(request: Request) {
  const db = getDb();
  if (!db) return NextResponse.json({ error: "No database connected." }, { status: 503 });
  const parsed = MarkSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Send { caseIds: [...] }." }, { status: 400 });
  const { data, error } = await db
    .from("cases")
    .update({ alerted_at: new Date().toISOString() })
    .in("id", parsed.data.caseIds)
    .is("alerted_at", null)
    .select("id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ marked: data.length });
}
