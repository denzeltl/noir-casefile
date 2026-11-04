import { NextResponse, after } from "next/server";
import { getDb } from "@/lib/db";
import { HookDecisionSchema, RenderResultSchema, VideoDecisionSchema } from "@/lib/ads/schemas";
import { pausedAt, resumeRun } from "@/lib/ads/runner";

const PAUSES = {
  pickHook: {
    schema: HookDecisionSchema,
    from: "waiting_hook",
    hint: "Choose a hook, edit one, or send a rewrite note.",
  },
  render: { schema: RenderResultSchema, from: "rendering", hint: 'Send { action: "rendered", videoUrl }.' },
  approveVideo: {
    schema: VideoDecisionSchema,
    from: "waiting_video",
    hint: "Approve, re-render or discard the video.",
  },
} as const;

/**
 * POST /api/ads/runs/[id]/resume — answers whichever interrupt the run is paused at.
 *   pick_hook (admin):  { action: "choose", hookId } | { action: "edit", hookId, hook, script } | { action: "rewrite", note }
 *   render (worker):    { action: "rendered", videoUrl }
 *   approve_video (admin): { action: "approve" | "rerender" | "discard" }
 * Auth: admin cookie or x-n8n-secret, enforced in src/proxy.ts.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/ads/runs/[id]/resume">) {
  const { id } = await ctx.params;
  const db = getDb();
  if (!db) return NextResponse.json({ error: "No database connected." }, { status: 503 });

  const node = await pausedAt(id).catch(() => null);
  if (!node) return NextResponse.json({ error: "This run isn't waiting for an answer." }, { status: 409 });

  const body = await request.json().catch(() => null);
  const pause = PAUSES[node];
  const parsed = pause.schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: pause.hint }, { status: 400 });

  // Claim the pause: only one answer wins a double submit. A render result
  // must come from the worker that claimed the run (status = rendering).
  const from = pause.from;
  const { data: claimed, error } = await db
    .from("ad_runs")
    .update({ status: "running", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", from)
    .select("id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!claimed?.length) {
    return NextResponse.json({ error: "Someone already answered this run." }, { status: 409 });
  }

  after(() => resumeRun(id, parsed.data));
  return NextResponse.json({ runId: id, status: "running" }, { status: 202 });
}
