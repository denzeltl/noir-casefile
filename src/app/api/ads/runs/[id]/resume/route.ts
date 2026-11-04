import { NextResponse, after } from "next/server";
import { getDb } from "@/lib/db";
import { HookDecisionSchema } from "@/lib/ads/schemas";
import { isWaitingForHook, resumeRun } from "@/lib/ads/runner";

/**
 * POST /api/ads/runs/[id]/resume
 *   { action: "choose", hookId } | { action: "edit", hookId, hook, script } | { action: "rewrite", note }
 * Answers interrupt #1. Auth: admin cookie or x-n8n-secret, enforced in src/proxy.ts.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/ads/runs/[id]/resume">) {
  const { id } = await ctx.params;
  const db = getDb();
  if (!db) return NextResponse.json({ error: "No database connected." }, { status: 503 });

  const parsed = HookDecisionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Choose a hook, edit one, or send a rewrite note." }, { status: 400 });
  }

  if (!(await isWaitingForHook(id).catch(() => false))) {
    return NextResponse.json({ error: "This run isn't waiting for a hook." }, { status: 409 });
  }

  // Claim the pause: only one decision wins a double submit.
  const { data: claimed, error } = await db
    .from("ad_runs")
    .update({ status: "running", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "waiting_hook")
    .select("id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!claimed?.length) {
    return NextResponse.json({ error: "Someone already answered this run." }, { status: 409 });
  }

  after(() => resumeRun(id, parsed.data));
  return NextResponse.json({ runId: id, status: "running" }, { status: 202 });
}
