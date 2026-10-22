"use client";

import { motion } from "motion/react";
import { useGame } from "@/context/GameContext";
import { ArrowLeft, Gavel } from "lucide-react";
import { DIFFICULTY_CONFIGS } from "@/types/case";
import { useRouter } from "next/navigation";

export default function CaseHeader() {
  const { state, dispatch } = useGame();
  const router = useRouter();
  const c = state.activeCase;
  if (!c) return null;

  const cfg = DIFFICULTY_CONFIGS[state.difficulty] || DIFFICULTY_CONFIGS.medium;
  const left = state.questionsRemaining;
  const low = left <= 2;

  return (
    <header className="z-30 shrink-0 border-b border-rule-strong bg-desk px-3 py-2.5 sm:px-6">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 flex-[1_1_16rem] items-center gap-2.5">
          <button
            type="button"
            onClick={() => router.push("/")}
            aria-label="Back to the front page"
            title="Back to the front page"
            className="btn btn-quiet flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted hover:text-ink"
          >
            <ArrowLeft className="nudge-left h-4 w-4" aria-hidden="true" />
          </button>
          <div className="min-w-0">
            <p className="label truncate">{cfg.label} · Victim: {c.victim.name}</p>
            <h1 className="truncate text-[20px] leading-tight sm:text-[22px]" title={c.title}>{c.title}</h1>
          </div>
        </div>

        <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 max-sm:w-full max-sm:justify-between sm:gap-3">
          {/* Question budget: one box per question, inked while unspent. */}
          <div
            className="flex items-center gap-2"
            role="status"
            aria-label={`${left} of ${cfg.maxQuestions} questions left`}
          >
            <span className="hidden gap-[3px] md:flex" aria-hidden="true">
              {Array.from({ length: cfg.maxQuestions }).map((_, i) => (
                <i key={i} className={`relative block h-4 w-2.5 border ${low ? "border-pen" : "border-ink/70"}`}>
                  <i
                    className={`absolute inset-[2px] origin-bottom transition-transform duration-200 ease-[var(--ease-out)] ${low ? "bg-pen" : "bg-ink"}`}
                    style={{ transform: i < left ? "scaleY(1)" : "scaleY(0)" }}
                  />
                </i>
              ))}
            </span>
            <span className={`font-mono text-[13px] uppercase tabular-nums ${low ? "text-pen" : ""}`}>
              <motion.strong
                key={left}
                className="inline-block text-[16px] font-semibold"
                initial={{ transform: "scale(1.3)", opacity: 0.5 }}
                animate={{ transform: "scale(1)", opacity: 1 }}
                transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              >
                {left}
              </motion.strong>{" "}
              left
            </span>
          </div>

          <button
            type="button"
            onClick={() => dispatch({ type: "SHOW_BRIEFING", payload: true })}
            title="Case file"
            className="btn btn-quiet min-h-11 max-w-[12rem] cursor-pointer truncate rounded-md px-3 font-mono text-[12px] uppercase"
          >
            Case file
          </button>

          <button
            type="button"
            onClick={() => dispatch({ type: "SHOW_ACCUSATION", payload: true })}
            title="Accuse"
            className="btn btn-pen inline-flex min-h-11 max-w-[12rem] cursor-pointer items-center gap-1.5 rounded-md px-3.5 font-mono text-[12px] font-semibold uppercase sm:px-4"
          >
            <Gavel className="tilt h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">Accuse</span>
          </button>
        </div>
      </div>
    </header>
  );
}
