"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminRun } from "@/lib/admin-data";
import { PASS_SCORE, type HookDecision, type VideoDecision } from "@/lib/ads/schemas";
import RunTimeline from "./RunTimeline";

const STAMP: Record<string, { label: string; className: string }> = {
  waiting_hook: { label: "Needs you", className: "border-pen text-pen" },
  running: { label: "Running", className: "border-muted text-muted" },
  waiting_render: { label: "Queued", className: "border-muted text-muted" },
  rendering: { label: "Rendering", className: "border-muted text-muted" },
  render_failed: { label: "Render failed", className: "border-pen text-pen" },
  waiting_video: { label: "Needs you", className: "border-pen text-pen" },
  failed: { label: "Failed", className: "border-pen text-pen" },
  ready_to_post: { label: "Ready to post", className: "border-success-ink text-success-ink" },
  discarded: { label: "Discarded", className: "border-clip text-clip" },
};

// The graph and the render worker run in the background; while they do, re-read the run.
const POLL_MS = 4000;
const BUSY = ["running", "waiting_render", "rendering"];

type Notice = { tone: "ok" | "error"; text: string } | null;

export default function RunDesk({ run }: { run: AdminRun }) {
  const router = useRouter();
  const waiting = run.status === "waiting_hook" && run.hooks.length > 0;

  useEffect(() => {
    if (!BUSY.includes(run.status)) return;
    const t = setInterval(() => router.refresh(), POLL_MS);
    return () => clearInterval(t);
  }, [run.status, router]);

  const stamp = STAMP[run.status] ?? { label: run.status.replace(/_/g, " "), className: "border-muted text-muted" };

  return (
    <>
      <p className="label">Ad run · {run.id}</p>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="min-w-0 flex-[1_1_420px]">
          <h1 className="display text-[clamp(32px,5vw,40px)]">{run.caseTitle}</h1>
          {run.setting && (
            <p className="mt-2.5 max-w-[62ch] text-[15px] leading-normal text-muted">{run.setting}</p>
          )}
        </div>
        <span
          className={`mt-1.5 inline-block -rotate-[4deg] whitespace-nowrap rounded-sm border-2 px-2 py-1.5 font-mono text-[12px] font-semibold uppercase leading-none tracking-[0.12em] ${stamp.className}`}
        >
          {stamp.label}
        </span>
      </div>
      <RunTimeline run={run} />
      {run.loops > 0 && (
        <p className="label mt-1.5 tabular-nums text-ink">
          {run.loops} {run.loops === 1 ? "draft" : "drafts"} by the writer
        </p>
      )}

      <div className="mt-8">
        {waiting ? (
          <HookDesk run={run} />
        ) : run.status === "failed" ? (
          <RetrySheet
            run={run}
            label="The run failed"
            hint="Retry runs the failed step again and keeps everything before it."
            endpoint="retry"
            action="Retry run"
            pendingText="Restarting…"
          />
        ) : run.stalled ? (
          <RetrySheet
            run={{ ...run, error: "No progress for over 10 minutes. The server probably restarted or hung partway through a step." }}
            label="The run stalled"
            hint="Retry runs the stuck step again and keeps everything before it."
            endpoint="retry"
            action="Retry run"
            pendingText="Restarting…"
          />
        ) : run.status === "render_failed" ? (
          <RetrySheet
            run={run}
            label="The render failed"
            hint="Retry puts the same storyboard back in the render worker's queue."
            endpoint="retry-render"
            action="Retry render"
            pendingText="Queuing…"
          />
        ) : run.status === "waiting_render" || run.status === "rendering" ? (
          <StatusSheet label={run.status === "rendering" ? "Rendering the trailer" : "Waiting for the render worker"}>
            {run.status === "rendering"
              ? "Your PC is rendering the 15-second trailer. This usually takes under a minute."
              : run.workerOnline
                ? "The storyboard is written. The render worker will pick it up within seconds."
                : "The storyboard is written. The render worker is offline; start it with npm run render-worker and it will render this run."}
            <WorkerStatus online={run.workerOnline} lastSeen={run.workerLastSeen} />
          </StatusSheet>
        ) : (run.status === "waiting_video" || run.status === "ready_to_post") && run.videoUrl ? (
          <VideoReview run={run} />
        ) : run.status === "discarded" ? (
          <StatusSheet label="Discarded">This run was thrown out. Start a new ad for this case from the register.</StatusSheet>
        ) : run.status === "running" && run.chosenHook ? (
          <StatusSheet label="Writing the storyboard">
            “{run.chosenHook.hook}” is locked in. The storyboard is being written; the render worker takes it from there.
          </StatusSheet>
        ) : run.status === "running" ? (
          <StatusSheet label="Writing hooks">
            The writer and critic are working. This page updates by itself, usually within a minute.
          </StatusSheet>
        ) : (
          <StatusSheet label={stamp.label}>Nothing to decide on this run right now.</StatusSheet>
        )}
      </div>
    </>
  );
}

/** Interrupt #2: watch the render, then approve it, re-render it, or throw it out. */
function VideoReview({ run }: { run: AdminRun }) {
  const router = useRouter();
  const ready = run.status === "ready_to_post";
  const [pending, setPending] = useState<VideoDecision["action"] | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function decide(action: VideoDecision["action"]) {
    setPending(action);
    setNotice(null);
    try {
      const res = await fetch(`/api/ads/runs/${run.id}/resume`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action } satisfies VideoDecision),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNotice(body.error ?? `The studio answered ${res.status}.`);
        setPending(null);
        return;
      }
      router.refresh();
    } catch {
      setNotice("Couldn't reach the server. Check your connection and try again.");
      setPending(null);
    }
  }

  const quiet =
    "btn btn-quiet min-h-11 cursor-pointer rounded-md px-4 font-mono text-[12px] uppercase tracking-[0.04em] disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="sheet pane-in grid gap-6 px-6 py-6 sm:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
      <video
        src={run.videoUrl!}
        controls
        playsInline
        preload="metadata"
        className="aspect-[9/16] w-full max-w-[280px] rounded-sm bg-ink"
      />
      <div className="flex min-w-0 flex-col">
        <p className={`label ${ready ? "text-success-ink" : ""}`}>{ready ? "Ready to post" : "Trailer rendered"}</p>
        <p className="mt-2 max-w-[60ch] text-[15px] leading-relaxed">
          {ready
            ? "Approved. Download it and post it by hand on TikTok, Reels or Shorts."
            : "Watch it through. Approve it for the posting queue, render it again from the same storyboard, or throw it out."}
        </p>

        {ready ? (
          <a
            href={run.videoUrl!}
            download
            className="btn btn-ink mt-5 inline-flex min-h-11 items-center self-start rounded-md px-5 font-mono text-[13px] font-semibold uppercase"
          >
            Download MP4
          </a>
        ) : (
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={pending !== null}
              onClick={() => decide("approve")}
              className="btn btn-ink min-h-11 cursor-pointer rounded-md px-5 font-mono text-[13px] font-semibold uppercase disabled:cursor-not-allowed disabled:opacity-40"
            >
              {pending === "approve" ? "Approving…" : "Approve"}
            </button>
            <button type="button" disabled={pending !== null} onClick={() => decide("rerender")} className={quiet}>
              {pending === "rerender" ? "Queuing…" : "Re-render"}
            </button>
            {confirmDiscard ? (
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-[15px] text-pen">Throw this run out?</span>
                <button
                  type="button"
                  disabled={pending !== null}
                  onClick={() => decide("discard")}
                  className="btn btn-pen min-h-11 cursor-pointer rounded-md px-4 font-mono text-[12px] font-semibold uppercase tracking-[0.04em] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {pending === "discard" ? "Discarding…" : "Yes, discard"}
                </button>
                <button type="button" disabled={pending !== null} onClick={() => setConfirmDiscard(false)} className={quiet}>
                  Keep it
                </button>
              </span>
            ) : (
              <button type="button" disabled={pending !== null} onClick={() => setConfirmDiscard(true)} className={quiet}>
                Discard
              </button>
            )}
          </div>
        )}
        {notice && (
          <p className="mt-3 text-[15px] text-pen" aria-live="polite">
            {notice}
          </p>
        )}
        {!ready && (
          <a href={run.videoUrl!} download className="link-draw label mt-auto inline-flex min-h-11 items-center self-start pt-4 text-ink">
            Download MP4
          </a>
        )}
      </div>
    </div>
  );
}

function WorkerStatus({ online, lastSeen }: { online: boolean; lastSeen: string | null }) {
  return (
    <span className="label mt-4 flex items-center gap-2">
      <span aria-hidden className={`size-2 rounded-full ${online ? "bg-success-ink" : "bg-pen"}`} />
      {online ? "Worker online" : lastSeen ? `Worker offline · last seen ${new Date(lastSeen).toLocaleString()}` : "Worker has never checked in"}
    </span>
  );
}

/** Failed graph or failed render: what went wrong, what retry will do, and the button. */
function RetrySheet(props: {
  run: AdminRun;
  label: string;
  hint: string;
  endpoint: "retry" | "retry-render";
  action: string;
  pendingText: string;
}) {
  const { run } = props;
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function retry() {
    setPending(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/ads/runs/${run.id}/${props.endpoint}`, { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNotice(body.error ?? `The studio answered ${res.status}. Try again in a moment.`);
        setPending(false);
        return;
      }
      router.refresh();
    } catch {
      setNotice("Couldn't reach the server. Check your connection and try again.");
      setPending(false);
    }
  }

  return (
    <div role="alert" className="sheet pane-in px-6 py-8">
      <p className="label text-pen">{props.label}</p>
      <p className="mt-2 max-w-[60ch] text-[15px] leading-relaxed [overflow-wrap:anywhere]">
        {run.error ?? "No error was recorded."}
      </p>
      <p className="mt-2 max-w-[60ch] text-[15px] leading-relaxed text-muted">{props.hint}</p>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={pending}
          aria-busy={pending}
          onClick={retry}
          className="btn btn-ink min-h-11 cursor-pointer rounded-md px-5 font-mono text-[13px] font-semibold uppercase disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? props.pendingText : props.action}
        </button>
        {notice && <span className="text-[15px] text-pen" aria-live="polite">{notice}</span>}
      </div>
    </div>
  );
}

function StatusSheet({ label, tone, children }: { label: string; tone?: "error"; children: React.ReactNode }) {
  return (
    <div role={tone === "error" ? "alert" : "status"} className="sheet pane-in px-6 py-8">
      <p className={`label ${tone === "error" ? "text-pen" : ""}`}>{label}</p>
      <div className="mt-2 max-w-[60ch] text-[15px] leading-relaxed [overflow-wrap:anywhere]">{children}</div>
    </div>
  );
}

/** Index cards on the left, the selected hook on lined paper at reading size (editable). */
function HookDesk({ run }: { run: AdminRun }) {
  const router = useRouter();
  const [pickId, setPickId] = useState(run.hooks[0].id);
  const pick = run.hooks.find((h) => h.id === pickId) ?? run.hooks[0];
  const [hook, setHook] = useState(pick.hook);
  const [script, setScript] = useState(pick.script);
  const [rewriting, setRewriting] = useState(false);
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const sheetRef = useRef<HTMLElement>(null);

  const edited = hook.trim() !== pick.hook || script.trim() !== pick.script;
  const blank = !hook.trim() || !script.trim();

  function select(id: string) {
    const h = run.hooks.find((x) => x.id === id)!;
    setPickId(id);
    setHook(h.hook);
    setScript(h.script);
    // Below lg the sheet sits under the cards; bring it into view so the tap visibly lands.
    if (window.matchMedia("(max-width: 1023px)").matches) {
      const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      sheetRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
    }
  }

  async function submit() {
    const decision: HookDecision = rewriting
      ? { action: "rewrite", note: note.trim() }
      : edited
        ? { action: "edit", hookId: pick.id, hook: hook.trim(), script: script.trim() }
        : { action: "choose", hookId: pick.id };
    setPending(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/ads/runs/${run.id}/resume`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(decision),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNotice({ tone: "error", text: body.error ?? `The studio answered ${res.status}.` });
        setPending(false);
        return;
      }
      setNotice({
        tone: "ok",
        text: rewriting ? "Sent back to the writer with your note." : "Hook filed.",
      });
      router.refresh();
    } catch {
      setNotice({ tone: "error", text: "Couldn't reach the server. Check your connection and try again." });
      setPending(false);
    }
  }

  const goLabel = pending
    ? "Filing…"
    : rewriting
      ? "Send for rewrite"
      : edited
        ? "Use edited hook"
        : `Use ${pick.id.toUpperCase()}`;
  const goDisabled = pending || (rewriting ? note.trim().length < 3 : blank);

  return (
    <div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(260px,340px)_minmax(0,1fr)]">
        <div>
          <p className="label mb-2.5">Five hooks, best first</p>
          <div role="group" aria-label="Hooks" className="grid gap-2">
            {run.hooks.map((h) => {
              const on = h.id === pick.id;
              return (
                <button
                  key={h.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => select(h.id)}
                  className={`card-lift grid cursor-pointer grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 rounded-sm border border-rule-strong px-3.5 py-3 text-left transition-[transform,box-shadow,background-color] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                    on
                      ? "bg-sheet shadow-sheet max-lg:border-l-4 max-lg:border-l-hl-green lg:translate-x-2 lg:hover:translate-x-2"
                      : "bg-paper"
                  }`}
                >
                  <span className="label">
                    {h.id} · {h.angle}
                  </span>
                  <Grade score={h.score} className="row-span-2 self-center" />
                  <span className="text-[15px] leading-snug [overflow-wrap:anywhere]">{h.hook}</span>
                </button>
              );
            })}
          </div>
          {run.critique && (
            <p className="mt-4 text-[15px] leading-normal text-muted">
              <span className="label mr-1.5">Critic:</span>
              {run.critique}
            </p>
          )}
        </div>

        <article ref={sheetRef} className="sheet min-w-0 scroll-mt-6">
          <div className="flex items-baseline justify-between gap-3 border-b border-rule px-[clamp(16px,3vw,32px)] py-3.5">
            <span className="label min-w-0 truncate">
              {pick.id} · {pick.angle}
            </span>
            <Grade score={pick.score} />
          </div>
          <div key={pick.id} className="lined pane-in px-[clamp(16px,3vw,32px)] pb-7 pt-6">
            <label htmlFor="hook-line" className="label">
              Opening line · click to edit
            </label>
            <textarea
              id="hook-line"
              rows={2}
              maxLength={160}
              value={hook}
              onChange={(e) => setHook(e.target.value)}
              className="field mt-1.5 block w-full resize-none border-0 bg-transparent p-0 text-[clamp(26px,3.4vw,34px)] leading-[1.15] tracking-[-0.02em] [field-sizing:content]"
            />
            <label htmlFor="hook-script" className="label mt-4 block">
              15-second script
            </label>
            <textarea
              id="hook-script"
              rows={5}
              maxLength={600}
              value={script}
              onChange={(e) => setScript(e.target.value)}
              className="field block min-h-40 w-full resize-y border-0 bg-transparent p-0 text-[18px] leading-8 [field-sizing:content]"
            />
            {pick.feedback && (
              <p className="mt-4 border-l-2 border-pen pl-3 text-[15px] leading-normal text-pen">
                <span aria-hidden>✎ </span>
                <span className="sr-only">Critic: </span>
                {pick.feedback}
              </p>
            )}
          </div>
        </article>
      </div>

      <div className="sheet sticky bottom-0 z-10 mt-6">
        {rewriting && (
          <div className="pane-in px-4 pt-4">
            <label htmlFor="rewrite-note" className="label">
              Note for the writer
            </label>
            <textarea
              id="rewrite-note"
              rows={2}
              autoFocus
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Open on the velvet curtain and end on a dare."
              className="field mt-1.5 w-full rounded-sm border border-rule-strong bg-sheet px-3 py-2.5 text-[15px]"
            />
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 bg-paper px-4 py-3">
          <p aria-live="polite" className="min-w-0 flex-[1_1_220px] text-[15px] leading-snug max-sm:empty:hidden">
            {notice ? (
              <span className={notice.tone === "error" ? "text-pen" : "text-success-ink"}>{notice.text}</span>
            ) : (
              <span className="text-muted max-sm:hidden">
                Pick a hook, edit it if it needs it, or send them all back.
              </span>
            )}
          </p>
          <div className="flex min-w-0 flex-wrap gap-2 max-sm:w-full max-sm:[&>button]:flex-1">
            {edited && !rewriting && (
              <button
                type="button"
                disabled={pending}
                onClick={() => select(pick.id)}
                className="btn btn-quiet min-h-11 min-w-0 cursor-pointer rounded-md px-4 font-mono [overflow-wrap:anywhere] text-[12px] uppercase tracking-[0.04em] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Undo edits
              </button>
            )}
            <button
              type="button"
              aria-expanded={rewriting}
              disabled={pending}
              onClick={() => setRewriting((r) => !r)}
              className="btn btn-quiet min-h-11 min-w-0 cursor-pointer rounded-md px-4 [overflow-wrap:anywhere] lg:whitespace-nowrap font-mono text-[12px] uppercase tracking-[0.04em] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {rewriting ? "Cancel rewrite" : "Ask for rewrite"}
            </button>
            <button
              type="button"
              disabled={goDisabled}
              onClick={submit}
              className="btn btn-ink min-h-11 min-w-0 cursor-pointer rounded-md px-5 [overflow-wrap:anywhere] lg:whitespace-nowrap font-mono text-[13px] font-semibold uppercase disabled:cursor-not-allowed disabled:opacity-40"
            >
              {goLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Grade({ score, className = "" }: { score: number; className?: string }) {
  const pass = score >= PASS_SCORE;
  return (
    <span
      aria-label={`Critic score ${score} out of 10${pass ? ", passes" : ""}`}
      className={`font-mono text-[15px] font-semibold tabular-nums ${pass ? "text-success-ink" : "text-pen"} ${className}`}
    >
      {score}/10
    </span>
  );
}
