import { NextRequest, NextResponse, after } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import type { AdBrief } from "@/lib/ads/brief";
import { buildAdGraph, RECURSION_LIMIT } from "@/lib/ads/graph";

const BodySchema = z.object({ caseIds: z.array(z.string().min(1)).min(1).max(20) });

const ACTIVE = ["running", "waiting_hook", "waiting_render", "rendering", "render_failed", "waiting_video"];

/**
 * POST /api/ads/runs  { caseIds: string[] }
 * Starts one ad run per case. Idempotent: a case with an active run gets that run
 * back instead of a second one (double taps from the admin or Telegram).
 * Auth: admin cookie or x-n8n-secret, enforced in src/proxy.ts.
 */
export async function POST(request: NextRequest) {
  const db = getDb();
  if (!db) return NextResponse.json({ error: "No database connected." }, { status: 503 });

  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Send { caseIds: [...] } with 1–20 case ids." }, { status: 400 });
  }

  const runs: { caseId: string; runId: string; status: string; created: boolean }[] = [];
  const errors: { caseId: string; error: string }[] = [];

  for (const caseId of parsed.data.caseIds) {
    const existing = await findActiveRun(caseId);
    if (existing) {
      runs.push({ caseId, runId: existing.id, status: existing.status, created: false });
      continue;
    }

    const { data: c } = await db.from("cases").select("brief_json").eq("id", caseId).maybeSingle();
    if (!c) {
      errors.push({ caseId, error: "Case not found." });
      continue;
    }

    const runId = `run-${crypto.randomUUID()}`;
    const { error } = await db.from("ad_runs").insert({ id: runId, case_id: caseId, status: "running" });
    if (error) {
      // 23505: a parallel request won the one-active-run-per-case index.
      const raced = error.code === "23505" ? await findActiveRun(caseId) : null;
      if (raced) runs.push({ caseId, runId: raced.id, status: raced.status, created: false });
      else errors.push({ caseId, error: error.message });
      continue;
    }

    runs.push({ caseId, runId, status: "running", created: true });
    after(() => runGraph(runId, c.brief_json as AdBrief));
  }

  const status = runs.length === 0 ? 404 : 202;
  return NextResponse.json({ runs, errors }, { status });
}

async function findActiveRun(caseId: string) {
  const { data } = await getDb()!
    .from("ad_runs")
    .select("id, status")
    .eq("case_id", caseId)
    .in("status", ACTIVE)
    .maybeSingle();
  return data;
}

/** Graph v1: writer ⇄ critic until a hook passes, then wait for the admin's pick. */
async function runGraph(runId: string, brief: AdBrief) {
  const db = getDb()!;
  try {
    const result = await buildAdGraph().invoke({ brief }, { recursionLimit: RECURSION_LIMIT });
    await db
      .from("ad_runs")
      .update({
        status: "waiting_hook",
        hooks_json: { hooks: result.hooks, trail: result.trail },
        loops: result.loops,
        updated_at: new Date().toISOString(),
      })
      .eq("id", runId);
  } catch (err) {
    console.error(`[ads] run ${runId} failed:`, err);
    await db
      .from("ad_runs")
      .update({
        status: "failed",
        error: err instanceof Error ? err.message.slice(0, 1000) : String(err),
        updated_at: new Date().toISOString(),
      })
      .eq("id", runId);
  }
}
