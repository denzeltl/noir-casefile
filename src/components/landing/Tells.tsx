"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import Highlight from "@/components/Highlight";
import { RevealGroup, revealItem } from "./Reveal";

const STATEMENTS = [
  {
    who: "Nell Avery, night manager",
    verdict: "Innocent",
    q: "Where were you when it happened?",
    a: (on: boolean) => (
      <>
        In the cellar doing inventory with the porter.{" "}
        <Highlight tone="green" on={on}>Check the delivery log on the front desk.</Highlight>
      </>
    ),
    notes: ["Names a witness and a record you can check.", "Same story every time you ask."],
  },
  {
    who: "Celeste Moreau, singer",
    verdict: "Guilty",
    q: "A piece of your velvet cape was found by the body.",
    a: (on: boolean) => (
      <>
        <Highlight on={on}>I haven&apos;t worn that cape in weeks.</Highlight> Ask Marcus about his gambling
        debts instead of hounding me.
      </>
    ),
    notes: ["Denies the physical clue outright.", "Points you at someone else."],
  },
];

/**
 * Beat 5 (reveal): two plain statements; a wipe scrubbed by scroll lays the
 * marked-up copy over them, so the visitor sees what a careful reading adds.
 */
export default function Tells() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "start 0.3"] });
  const clip = useTransform(scrollYProgress, [0, 1], ["inset(0 100% 0 0)", "inset(0 0% 0 0)"]);

  return (
    <section aria-labelledby="tells-title" className="border-t border-rule-strong">
      <div className="mx-auto max-w-7xl px-[clamp(16px,4vw,48px)] py-[clamp(64px,9vw,112px)]">
        <RevealGroup>
          <motion.p variants={revealItem} className="label">Reading people</motion.p>
          <motion.h2 variants={revealItem} id="tells-title" className="display mt-3 max-w-[20ch] text-[clamp(34px,4.2vw,56px)]">
            The innocent give you something to check. The guilty give you someone else.
          </motion.h2>
        </RevealGroup>

        <div ref={ref} className="mt-12 grid gap-6 min-[760px]:grid-cols-2">
          {STATEMENTS.map((s) => (
            <div key={s.who} className="relative min-w-0">
              {/* Plain copy underneath. */}
              <Statement s={s} marked={false} />
              {/* Marked-up copy, wiped on by scroll. */}
              <motion.div
                className="absolute inset-0"
                style={{ clipPath: reduce ? "none" : clip }}
                aria-hidden="true"
              >
                <Statement s={s} marked />
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Statement({ s, marked }: { s: (typeof STATEMENTS)[number]; marked: boolean }) {
  return (
    <article className="sheet flex h-full flex-col bg-sheet p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="label">{s.who}</span>
        <span className={`label ${marked ? (s.verdict === "Guilty" ? "!text-pen" : "!text-success-ink") : "opacity-0"}`}>
          {s.verdict}
        </span>
      </div>
      <p className="mt-4"><span className="label mr-2">Det.</span>{s.q}</p>
      <p className="mt-2"><span className="label mr-2">Ans.</span>{s.a(marked)}</p>
      <ul className={`mt-auto space-y-1 pt-5 font-mono text-[13px] leading-snug ${marked ? "text-pen" : "opacity-0"}`}>
        {s.notes.map((n) => <li key={n}>→ {n}</li>)}
      </ul>
    </article>
  );
}
