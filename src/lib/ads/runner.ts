import "server-only";
import { Command } from "@langchain/langgraph";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { getDb } from "@/lib/db";
import type { AdBrief } from "./brief";
import { buildAdGraph, RECURSION_LIMIT } from "./graph";
import { notifyRunStatus } from "./notify";
import type { HookDecision, RenderResult, VideoDecision } from "./schemas";

let saver: Promise<PostgresSaver> | null = null;

/** One checkpointer per server process; creates its tables on first use. */
function getCheckpointer(): Promise<PostgresSaver> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL isn't set, so runs can't pause and resume.");
  saver ??= (async () => {
    const s = PostgresSaver.fromConnString(url);
    await s.setup();
    return s;
  })().catch((err) => {
    saver = null;
    throw err;
  });
  return saver;
}

async function getGraph() {
  return buildAdGraph(await getCheckpointer());
}

/** Start a run from its brief. thread_id = run id, so the checkpoint is keyed by the run. */
export function startRun(runId: string, brief: AdBrief) {
  return advance(runId, { brief });
}

/** Answer whichever interrupt the run is paused at and run to the next pause. */
export function resumeRun(runId: string, answer: HookDecision | RenderResult | VideoDecision) {
  return advance(runId, new Command({ resume: answer }));
}

export type PausedAt = "pickHook" | "render" | "approveVideo" | null;
const PAUSES = ["pickHook", "render", "approveVideo"];

/** The node the run's checkpoint is paused at, or null. Guards the resume route. */
export async function pausedAt(runId: string): Promise<PausedAt> {
  const snap = await (await getGraph()).getState({ configurable: { thread_id: runId } });
  const task = snap.tasks.find((t) => t.interrupts.length > 0);
  return task && PAUSES.includes(task.name) ? (task.name as PausedAt) : null;
}

// ad_runs.status for each pause. A finished graph carries its outcome instead.
const STATUS_AT: Record<Exclude<PausedAt, null>, string> = {
  pickHook: "waiting_hook",
  render: "waiting_render",
  approveVideo: "waiting_video",
};

/**
 * Invoke until the graph pauses or ends, then mirror the checkpoint into
 * ad_runs (the admin reads that table, never the checkpoint). Never throws.
 */
async function advance(runId: string, input: Parameters<Awaited<ReturnType<typeof getGraph>>["invoke"]>[0]) {
  const db = getDb()!;
  const config = { configurable: { thread_id: runId } };
  try {
    const graph = await getGraph();
    const result = await graph.invoke(input, { ...config, recursionLimit: RECURSION_LIMIT });
    const snap = await graph.getState(config);
    const node = snap.tasks.find((t) => t.interrupts.length > 0)?.name as PausedAt | undefined;
    const status = node ? STATUS_AT[node] : (result.outcome ?? "failed");
    await db
      .from("ad_runs")
      .update({
        status,
        hooks_json: { hooks: result.hooks, trail: result.trail, critique: result.feedback },
        chosen_hook: result.chosenHook ?? null,
        storyboard_json: result.storyboard ? { storyboard: result.storyboard, trailer: result.trailer } : null,
        video_url: result.videoUrl ?? null,
        claimed_at: null,
        loops: result.loops,
        error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", runId);
    await notifyRunStatus({ runId, status, caseTitle: result.brief.title, videoUrl: result.videoUrl });
  } catch (err) {
    console.error(`[ads] run ${runId} failed:`, err);
    const error = err instanceof Error ? err.message.slice(0, 1000) : String(err);
    await db
      .from("ad_runs")
      .update({ status: "failed", error, updated_at: new Date().toISOString() })
      .eq("id", runId);
    const { data } = await db.from("ad_runs").select("cases(brief_json->>title)").eq("id", runId).maybeSingle();
    const caseTitle = (data?.cases as unknown as { title?: string } | null)?.title ?? "Unknown case";
    await notifyRunStatus({ runId, status: "failed", caseTitle, error });
  }
}
