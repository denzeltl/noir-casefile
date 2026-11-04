"use client";

import type { AdminRun } from "@/lib/admin-data";
import { clock, timelineRows } from "./timeline";

/** The run log: a ledger sheet, one typed row per graph step (time, step, model). Failures in red pen. */
export default function RunTimeline({ run }: { run: AdminRun }) {
  const rows = timelineRows(run);
  if (!rows.length) return null;
  return (
    <section aria-labelledby="run-log" className="sheet mt-6 px-5 py-4">
      <h2 id="run-log" className="label">Run log</h2>
      <ol className="mt-2 divide-y divide-rule">
        {rows.map((r, i) => (
          <li
            key={i}
            className={`grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-4 py-2 sm:grid-cols-[5.5rem_minmax(0,1fr)_auto] ${r.failed ? "text-pen" : ""}`}
          >
            <span className="label tabular-nums leading-6">{clock(r.at)}</span>
            <span className="min-w-0 text-[15px] leading-6 [overflow-wrap:anywhere]">{r.label}</span>
            {r.detail && (
              <span className="label col-start-2 leading-6 [overflow-wrap:anywhere] sm:col-start-3 sm:text-right">
                {r.detail}
              </span>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
