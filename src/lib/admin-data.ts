import "server-only";
import { getDb } from "@/lib/db";
import type { AdBrief } from "@/lib/ads/brief";
import { DIFFICULTY_CONFIGS, DifficultySchema } from "@/types/case";

/** What the admin sees about a case's ad, collapsed from ad_runs.status. */
export type AdState = "none" | "running" | "waiting" | "ready" | "failed";

export interface AdminCaseRow {
  id: string;
  title: string;
  setting: string;
  level: string;
  filed: string;
  suspects: number;
  clues: number;
  ad: AdState;
  runId: string | null;
}

const RUN_TO_STATE: Record<string, AdState> = {
  running: "running",
  waiting_render: "running",
  rendering: "running",
  waiting_hook: "waiting",
  waiting_video: "waiting",
  render_failed: "failed",
  failed: "failed",
  ready_to_post: "ready",
  discarded: "none",
};

const filedFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/**
 * Cases for the admin register, newest first. Reads brief_json only: the full
 * case (with the solution) never leaves the server.
 * Returns null when Supabase isn't configured.
 */
export async function listAdminCases(): Promise<AdminCaseRow[] | null> {
  const db = getDb();
  if (!db) return null;

  const [cases, runs] = await Promise.all([
    db
      .from("cases")
      .select("id, created_at, difficulty, brief_json")
      .order("created_at", { ascending: false })
      .limit(500),
    db
      .from("ad_runs")
      .select("id, case_id, status, created_at")
      .order("created_at", { ascending: false }),
  ]);
  if (cases.error) throw new Error(cases.error.message);
  if (runs.error) throw new Error(runs.error.message);

  // Latest run per case decides its badge.
  const latestRun = new Map<string, { id: string; status: string }>();
  for (const r of runs.data) if (!latestRun.has(r.case_id)) latestRun.set(r.case_id, r);

  return cases.data.map((c) => {
    const brief = c.brief_json as AdBrief;
    const run = latestRun.get(c.id);
    const difficulty = DifficultySchema.safeParse(c.difficulty);
    return {
      id: c.id,
      title: brief.title,
      setting: brief.setting,
      level: difficulty.success ? DIFFICULTY_CONFIGS[difficulty.data].label : c.difficulty,
      filed: filedFormat.format(new Date(c.created_at)),
      suspects: brief.suspects.length,
      clues: brief.clues.length,
      ad: run ? (RUN_TO_STATE[run.status] ?? "running") : "none",
      runId: run && run.status !== "discarded" ? run.id : null,
    };
  });
}
