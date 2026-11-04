import type { AdminRun, TimelineStep } from "@/lib/admin-data";

/** Plain names for graph nodes and what each decision meant. */
const NODE: Record<string, string> = {
  hookWriter: "Hooks written",
  critic: "Critic scored them",
  pickHook: "Your pick",
  storyboardWriter: "Storyboard written",
  render: "Trailer rendered",
  approveVideo: "Your review",
};

const DECISION: Record<string, string> = {
  "pickHook:choose": "Picked a hook",
  "pickHook:edit": "Edited and picked a hook",
  "pickHook:rewrite": "Asked for a rewrite",
  "approveVideo:approve": "Approved the video",
  "approveVideo:rerender": "Asked for a re-render",
  "approveVideo:discard": "Discarded the video",
  "approveVideo:revise": "Asked for a revision",
};

export interface TimelineRow {
  label: string;
  /** Model id for LLM nodes, empty for decisions. */
  detail: string;
  at: string | null;
  failed?: boolean;
}

export function timelineRows(run: AdminRun): TimelineRow[] {
  const rows: TimelineRow[] = run.trail.map((s: TimelineStep) => {
    const decision = DECISION[`${s.node}:${s.detail}`];
    return {
      label: decision ?? NODE[s.node] ?? s.node,
      detail: decision || s.detail === "done" ? "" : s.detail,
      at: s.at,
    };
  });
  if (run.failedNode) {
    rows.push({ label: `Failed at: ${(NODE[run.failedNode] ?? run.failedNode).toLowerCase()}`, detail: "", at: run.failedAt, failed: true });
  }
  return rows;
}

export function clock(at: string | null): string {
  return at ? new Date(at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—";
}
