"use client";

import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Loader2, RotateCcw } from "lucide-react";
import { DIFFICULTIES, DIFFICULTY_CONFIGS, type Difficulty } from "@/types/case";

interface DifficultySliderProps {
  difficulty: Difficulty;
  onChange: (diff: Difficulty) => void;
  onLaunch?: () => void;
  onResume?: () => void;
  hasActiveCase?: boolean;
  isLoading?: boolean;
}

/** Case request form: pick a level, read what it means, open the file. */
export default function DifficultySlider({
  difficulty,
  onChange,
  onLaunch,
  onResume,
  hasActiveCase = false,
  isLoading = false,
}: DifficultySliderProps) {
  const currentIndex = DIFFICULTIES.indexOf(difficulty);
  const cfg = DIFFICULTY_CONFIGS[difficulty];

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const idx = parseInt(e.target.value, 10);
    if (!isNaN(idx) && DIFFICULTIES[idx]) onChange(DIFFICULTIES[idx]);
  };

  return (
    <div className="sheet relative bg-sheet p-5 sm:p-7">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="label">Case request · Form 7-B</span>
        <span className="label tabular-nums">Level {currentIndex + 1} of 4</span>
      </div>

      <h3 className="display relative mt-3 overflow-hidden text-[clamp(32px,3.4vw,44px)]">
        {/* The level name rolls up when it changes. */}
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={cfg.label}
            className="block"
            initial={{ opacity: 0, transform: "translateY(60%)" }}
            animate={{ opacity: 1, transform: "translateY(0%)" }}
            exit={{ opacity: 0, transform: "translateY(-60%)" }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
          >
            {cfg.label}
          </motion.span>
        </AnimatePresence>
      </h3>

      {/* Level picker: a ruled line with four marks; the labels are buttons too. */}
      <div className="mt-6">
        <input
          type="range"
          min={0}
          max={DIFFICULTIES.length - 1}
          step={1}
          value={currentIndex}
          onChange={handleSliderChange}
          aria-label="Case difficulty"
          aria-valuetext={cfg.label}
          className="case-range h-11 w-full"
          style={{ "--fill": `${(currentIndex / (DIFFICULTIES.length - 1)) * 100}%` } as React.CSSProperties}
        />
        <div className="mt-1 grid grid-cols-4" role="group" aria-label="Difficulty levels">
          {DIFFICULTIES.map((key, idx) => {
            const active = key === difficulty;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onChange(key)}
                aria-pressed={active}
                className={`relative min-h-11 cursor-pointer px-1 font-mono text-[11px] uppercase [overflow-wrap:normal] min-[420px]:text-[12px] min-[420px]:tracking-[0.04em] transition-colors duration-150 ${
                  idx === 0 ? "text-left" : idx === 3 ? "text-right" : "text-center"
                } ${active ? "text-ink" : "text-muted hover:text-ink"}`}
              >
                <span className="relative inline-block pb-1">
                  {DIFFICULTY_CONFIGS[key].label}
                  {/* One underline that travels to the chosen level. */}
                  {active && (
                    <motion.span
                      layoutId="level-underline"
                      className="absolute inset-x-0 bottom-0 h-0.5 bg-ink"
                      transition={{ type: "spring", stiffness: 420, damping: 36 }}
                    />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-3 border-y border-rule-strong">
        {[
          ["Suspects", cfg.suspectCount],
          ["Clues", cfg.clueCount],
          ["Questions", cfg.maxQuestions],
        ].map(([k, v], i) => (
          <div key={k} className={`py-3 ${i > 0 ? "border-l border-rule-strong pl-4" : ""}`}>
            <dt className="label">{k}</dt>
            <dd className="font-mono text-[28px] leading-tight tabular-nums">
              <motion.span
                key={`${k}-${v}`}
                className="inline-block"
                initial={{ opacity: 0.4, transform: "scale(1.15)" }}
                animate={{ opacity: 1, transform: "scale(1)" }}
                transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
              >
                {v}
              </motion.span>
            </dd>
          </div>
        ))}
      </dl>

      <motion.div
        key={difficulty}
        initial={{ opacity: 0, transform: "translateY(4px)" }}
        animate={{ opacity: 1, transform: "translateY(0px)" }}
        transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
        className="mt-5 space-y-2 text-[16px] leading-relaxed"
      >
        <p><span className="label mr-2">Killer</span>{cfg.killerBehavior}</p>
      </motion.div>

      {onLaunch && (
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
          {hasActiveCase && onResume ? (
            <>
              <button
                type="button"
                onClick={onResume}
                className="btn btn-ink inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-md px-6 font-mono text-[14px] font-semibold uppercase"
              >
                Return to current case <ArrowRight className="nudge-right h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={onLaunch}
                disabled={isLoading}
                className="btn btn-quiet inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-md px-5 font-mono text-[13px] font-semibold uppercase text-ink disabled:cursor-wait disabled:opacity-60"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <RotateCcw className="tilt h-4 w-4" aria-hidden="true" />}
                {isLoading ? "Writing the file…" : `Start a new ${cfg.label} case`}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onLaunch}
              disabled={isLoading}
              className="btn btn-ink inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-md px-7 font-mono text-[14px] font-semibold uppercase disabled:cursor-wait disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Writing the file…
                </>
              ) : (
                <>
                  Open a {cfg.label} case <ArrowRight className="nudge-right h-4 w-4" aria-hidden="true" />
                </>
              )}
            </button>
          )}
          {isLoading && (
            <p className="label" role="status">Writing the victim, clues and alibis. This takes a few seconds.</p>
          )}
        </div>
      )}
    </div>
  );
}
