"use client";

import { useMemo, useState } from "react";
import type { AdState, AdminCaseRow } from "@/lib/admin-data";

const STAMP: Record<AdState, { label: string; className: string }> = {
  none: { label: "No ad", className: "border-clip text-clip" },
  running: { label: "Running", className: "border-muted text-muted" },
  waiting: { label: "Needs you", className: "border-pen text-pen" },
  ready: { label: "Ready", className: "border-success-ink text-success-ink" },
  failed: { label: "Failed", className: "border-pen text-pen" },
};

// `short` keeps all four tabs visible on a phone.
const FILTERS: { id: string; label: string; short?: string; match: (s: AdState) => boolean }[] = [
  { id: "all", label: "All", match: () => true },
  { id: "none", label: "No ad", match: (s) => s === "none" },
  { id: "waiting", label: "Needs you", match: (s) => s === "waiting" || s === "failed" },
  { id: "ready", label: "Ready to post", short: "Ready", match: (s) => s === "ready" },
];

type Notice = { tone: "ok" | "error"; text: string } | null;

export default function CaseRegister({ cases }: { cases: AdminCaseRow[] }) {
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const counts = useMemo(
    () => Object.fromEntries(FILTERS.map((f) => [f.id, cases.filter((c) => f.match(c.ad)).length])),
    [cases]
  );
  const active = FILTERS.find((f) => f.id === filter) ?? FILTERS[0];
  const rows = cases.filter((c) => active.match(c.ad));
  const visibleSelected = rows.filter((r) => selected.has(r.id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function createAds(caseIds: string[]) {
    setPending(true);
    setNotice(null);
    try {
      const res = await fetch("/api/ads/runs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ caseIds }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNotice({ tone: "error", text: body.error ?? `The studio answered ${res.status}.` });
      } else {
        setNotice({ tone: "ok", text: `${caseIds.length === 1 ? "Ad run" : `${caseIds.length} ad runs`} started.` });
        setSelected(new Set());
      }
    } catch {
      setNotice({ tone: "error", text: "Couldn't reach the server. Check your connection and try again." });
    } finally {
      setPending(false);
    }
  }

  if (cases.length === 0) {
    return (
      <div className="sheet px-6 py-10 text-center">
        <p className="label">Register empty</p>
        <p className="mx-auto mt-2 max-w-[44ch] text-[15px] leading-relaxed text-muted">
          No cases yet. Each time a player opens a new case it lands here, ready for an ad.
        </p>
      </div>
    );
  }

  const n = visibleSelected.length;

  return (
    <div>
      <div role="tablist" aria-label="Filter cases by ad status" className="relative z-10 -mb-px flex gap-1 overflow-x-auto overflow-y-hidden">
        {FILTERS.map((f) => {
          const on = f.id === filter;
          return (
            <button
              key={f.id}
              role="tab"
              aria-selected={on}
              onClick={() => setFilter(f.id)}
              className={`btn relative min-h-11 shrink-0 cursor-pointer whitespace-nowrap rounded-t-md border border-b-0 border-rule-strong px-2.5 font-mono text-[12px] sm:px-3.5 uppercase tracking-[0.04em] ${
                on ? "bg-sheet text-ink" : "bg-desk text-muted hover:text-ink"
              }`}
            >
              {f.short ? (
                <>
                  <span className="sm:hidden">{f.short}</span>
                  <span className="max-sm:hidden">{f.label}</span>
                </>
              ) : (
                f.label
              )}
              <span className="ml-1.5 tabular-nums">{counts[f.id]}</span>
            </button>
          );
        })}
      </div>

      <div className="sheet" role="tabpanel">
        {rows.length === 0 ? (
          <p className="px-6 py-10 text-center text-[15px] text-muted">
            Nothing filed under “{active.label}”.
          </p>
        ) : (
          <table className="w-full border-collapse">
            <thead className="max-lg:hidden">
              <tr className="border-b border-rule-strong text-left">
                <th className="w-10 py-3 pl-4"><span className="sr-only">Select</span></th>
                <th className="label px-4 py-3 font-medium">Case</th>
                <th className="label px-4 py-3 font-medium">Filed</th>
                <th className="label px-4 py-3 font-medium">Level</th>
                <th className="label px-4 py-3 font-medium">Ad</th>
                <th className="py-3 pr-4"><span className="sr-only">Action</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const stamp = STAMP[c.ad];
                const checked = selected.has(c.id);
                return (
                  <tr
                    key={c.id}
                    className={`border-b border-rule transition-colors duration-150 last:border-b-0 max-lg:grid max-lg:grid-cols-[28px_minmax(0,1fr)_auto] max-lg:gap-x-3 max-lg:gap-y-1 max-lg:px-4 max-lg:py-4 lg:hover:bg-paper ${
                      checked ? "bg-paper" : ""
                    }`}
                  >
                    <td className="py-4 pl-4 align-top max-lg:p-0 lg:align-middle">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(c.id)}
                        aria-label={`Select ${c.title}`}
                        className="mt-1 size-[18px] cursor-pointer accent-ink lg:mt-0"
                      />
                    </td>
                    <td className="min-w-0 px-4 py-4 max-lg:p-0">
                      <p className="text-[18px] leading-snug [overflow-wrap:anywhere]">{c.title}</p>
                      <p className="mt-0.5 text-[15px] leading-snug text-muted [overflow-wrap:anywhere]">
                        {c.setting}
                      </p>
                    </td>
                    <td className="label whitespace-nowrap px-4 py-4 tabular-nums max-lg:col-start-2 max-lg:p-0">
                      {c.filed}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 font-mono text-[12px] uppercase tracking-[0.04em] max-lg:col-start-2 max-lg:p-0">
                      {c.level}
                      <span className="text-muted"> · {c.suspects} suspects</span>
                    </td>
                    <td className="px-4 py-4 max-lg:col-start-3 max-lg:row-start-1 max-lg:p-0">
                      <span
                        className={`inline-block -rotate-[4deg] whitespace-nowrap rounded-sm border-2 px-2 py-1.5 font-mono text-[12px] font-semibold uppercase leading-none tracking-[0.12em] ${stamp.className}`}
                      >
                        {stamp.label}
                      </span>
                    </td>
                    <td className="py-4 pr-4 text-right max-lg:col-start-2 max-lg:col-end-4 max-lg:p-0 max-lg:pt-2 max-lg:text-left">
                      {c.ad === "none" ? (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => createAds([c.id])}
                          className="btn btn-quiet min-h-11 cursor-pointer whitespace-nowrap rounded-md px-4 font-mono text-[12px] uppercase tracking-[0.04em] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Create ad
                        </button>
                      ) : (
                        <a
                          href={c.runId ? `/admin/runs/${c.runId}` : undefined}
                          aria-disabled={!c.runId}
                          className="btn btn-quiet inline-flex min-h-11 items-center whitespace-nowrap rounded-md px-4 font-mono text-[12px] uppercase tracking-[0.04em]"
                        >
                          Open run
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rule-strong bg-paper px-4 py-3">
          <p aria-live="polite" className="min-w-0 flex-1 basis-56">
            {notice ? (
              <span
                className={`text-[15px] leading-snug ${notice.tone === "error" ? "text-pen" : "text-success-ink"}`}
              >
                {notice.text}
              </span>
            ) : n === 0 ? (
              <span className="text-[15px] text-muted">Tick a case to start its ad.</span>
            ) : (
              <span className="label tabular-nums text-ink">{n} selected</span>
            )}
          </p>
          <button
            type="button"
            disabled={n === 0 || pending}
            onClick={() => createAds(visibleSelected.map((r) => r.id))}
            className="btn btn-ink min-h-11 cursor-pointer rounded-md px-5 font-mono text-[13px] font-semibold uppercase disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pending ? "Starting…" : n > 1 ? `Create ${n} ads` : "Create ad"}
          </button>
        </div>
      </div>
    </div>
  );
}
