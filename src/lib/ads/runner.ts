import "server-only";
import { Command } from "@langchain/langgraph";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { getDb } from "@/lib/db";
import type { AdBrief } from "./brief";
import { buildAdGraph, RECURSION_LIMIT } from "./graph";
import type { HookDecision } from "./schemas";

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

/** Feed the admin's decision into interrupt #1 and run to the next pause. */
export function resumeRun(runId: string, decision: HookDecision) {
  return advance(runId, new Command({ resume: decision }));
}

/** Is the run's checkpoint paused at pick_hook? Guards the resume route. */
export async function isWaitingForHook(runId: string): Promise<boolean> {
  const snap = await (await getGraph()).getState({ configurable: { thread_id: runId } });
  return snap.tasks.some((t) => t.name === "pickHook" && t.interrupts.length > 0);
}

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
    const paused = snap.tasks.some((t) => t.interrupts.length > 0);
    await db
      .from("ad_runs")
      .update({
        // Not paused means a hook was chosen; the storyboard node (step 5) takes it from here.
        status: paused ? "waiting_hook" : "running",
        hooks_json: { hooks: result.hooks, trail: result.trail, critique: result.feedback },
        chosen_hook: result.chosenHook ?? null,
        loops: result.loops,
        error: null,
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
