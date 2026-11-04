import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

/**
 * POST /api/ads/runs/[id]/retry-render — puts a failed render back in the
 * worker's queue. The graph never left the render pause, so nothing else moves.
 * Auth: admin cookie or x-n8n-secret, enforced in src/proxy.ts.
 */
export async function POST(_request: Request, ctx: RouteContext<"/api/ads/runs/[id]/retry-render">) {
  const { id } = await ctx.params;
  const db = getDb();
  if (!db) return NextResponse.json({ error: "No database connected." }, { status: 503 });

  const { data, error } = await db
    .from("ad_runs")
    .update({ status: "waiting_render", error: null, claimed_at: null, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "render_failed")
    .select("id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data?.length) return NextResponse.json({ error: "Only a failed render can be retried." }, { status: 409 });
  return NextResponse.json({ runId: id, status: "waiting_render" });
}
