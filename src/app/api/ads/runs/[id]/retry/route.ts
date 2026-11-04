import { NextResponse, after } from "next/server";
import { getDb } from "@/lib/db";
import type { AdBrief } from "@/lib/ads/brief";
import { retryRun, STALL_MS } from "@/lib/ads/runner";

/**
 * POST /api/ads/runs/[id]/retry — re-runs a failed run from the node that threw.
 * Hooks already written and picks already made are kept (they're in the checkpoint).
 * Also takes a run stuck at "running" with no progress for STALL_MS (the server
 * restarted or hung mid-step). Failed renders use /retry-render instead.
 * Auth: admin cookie or x-n8n-secret, enforced in src/proxy.ts.
 */
export async function POST(_request: Request, ctx: RouteContext<"/api/ads/runs/[id]/retry">) {
  const { id } = await ctx.params;
  const db = getDb();
  if (!db) return NextResponse.json({ error: "No database connected." }, { status: 503 });

  const { data, error } = await db
    .from("ad_runs")
    .update({ status: "running", error: null, updated_at: new Date().toISOString() })
    .eq("id", id)
    .or(`status.eq.failed,and(status.eq.running,updated_at.lt.${new Date(Date.now() - STALL_MS).toISOString()})`)
    .select("id, cases(brief_json)");
  if (error) {
    // 23505: the case got a new active run since this one failed.
    const msg =
      error.code === "23505"
        ? "This case already has another ad run going. Finish or discard that one first."
        : error.message;
    return NextResponse.json({ error: msg }, { status: 409 });
  }
  if (!data?.length) return NextResponse.json({ error: "Only a failed or stalled run can be retried." }, { status: 409 });

  const brief = (data[0].cases as unknown as { brief_json: AdBrief }).brief_json;
  after(() => retryRun(id, brief));
  return NextResponse.json({ runId: id, status: "running" }, { status: 202 });
}
