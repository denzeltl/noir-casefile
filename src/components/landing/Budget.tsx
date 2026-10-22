"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { RevealGroup, revealColumn, revealItem } from "./Reveal";
import { DIFFICULTIES, DIFFICULTY_CONFIGS } from "@/types/case";

/**
 * Beat 4 (count): the question budget per difficulty, from the game's own
 * config. Each row's boxes are ticked in as the table comes into view.
 */
export default function Budget() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const reduce = useReducedMotion();
  const drawn = inView || reduce;

  return (
    <section aria-labelledby="budget-title" className="border-t border-rule-strong bg-paper">
      <RevealGroup className="mx-auto grid max-w-7xl gap-10 px-[clamp(16px,4vw,48px)] py-[clamp(64px,9vw,112px)] min-[900px]:grid-cols-[0.75fr_1.25fr] min-[900px]:gap-16">
        <motion.div variants={revealColumn} className="min-w-0">
          <motion.p variants={revealItem} className="label">The budget</motion.p>
          <motion.h2 variants={revealItem} id="budget-title" className="display mt-3 text-[clamp(34px,4.2vw,56px)]">
            Every question costs you.
          </motion.h2>
          <motion.p variants={revealItem} className="mt-4 max-w-[44ch] text-muted">
            Questions come from one shared pool. Four spent on the bartender are four you can&apos;t ask
            the widow. Harder files bring more suspects and fewer questions.
          </motion.p>
        </motion.div>

        <motion.div variants={revealItem} ref={ref} className="min-w-0">
          <table className="w-full table-fixed border-collapse text-left" aria-label="Suspects and questions per difficulty">
            <colgroup>
              <col className="w-[32%]" />
              <col className="w-[22%] sm:w-[16%]" />
              <col />
            </colgroup>
            <thead>
              <tr className="border-b border-ink">
                <th scope="col" className="label pb-2 font-medium">Level</th>
                <th scope="col" className="label pb-2 font-medium [overflow-wrap:break-word]">Suspects</th>
                <th scope="col" className="label pb-2 font-medium">Questions</th>
              </tr>
            </thead>
            <tbody>
              {DIFFICULTIES.map((d, row) => {
                const cfg = DIFFICULTY_CONFIGS[d];
                return (
                  <tr key={d} className="border-b border-rule-strong align-middle">
                    <th scope="row" className="py-4 pr-4 text-[18px] font-normal sm:text-[22px]">{cfg.label}</th>
                    <td className="py-4 pr-4 font-mono text-[15px] tabular-nums">{cfg.suspectCount}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-x-3">
                        <span className="flex gap-[2px] sm:gap-[3px]" aria-hidden="true">
                          {Array.from({ length: cfg.maxQuestions }).map((_, i) => (
                            <i
                              key={i}
                              className="relative block h-3.5 w-2 shrink-0 border border-ink/70 sm:h-4 sm:w-3"
                            >
                              <i
                                className="absolute inset-[1.5px] origin-bottom sm:inset-[2px] bg-ink transition-transform duration-200 ease-[var(--ease-out)]"
                                style={{
                                  transform: drawn ? "scaleY(1)" : "scaleY(0)",
                                  transitionDelay: reduce ? "0ms" : `${row * 120 + i * 45}ms`,
                                }}
                              />
                            </i>
                          ))}
                        </span>
                        <span className="font-mono text-[15px] tabular-nums">{cfg.maxQuestions}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="label mt-4">Out of questions? You can still file charges. You can also file early.</p>
        </motion.div>
      </RevealGroup>
    </section>
  );
}
