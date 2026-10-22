"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useMotionValueEvent, useScroll, useTransform, type MotionValue } from "motion/react";
import Highlight from "@/components/Highlight";
import { useSceneMode } from "./useWide";

const CUES = [
  { k: "Read", t: "Read the statement against the clues." },
  { k: "Checks out", t: "Mark what a clue or witness confirms." },
  { k: "Motive", t: "Mark why they might have done it." },
  { k: "Contradiction", t: "Find the line a clue proves false. That's your crack." },
];

const CLUES = [
  { id: "01", text: "Candlestick, wiped clean, behind the bar" },
  { id: "02", text: "IOU for $400, signed T.M." },
  { id: "03", text: "Drummer's log: band on break 11:20 – 11:45" },
  { id: "04", text: "Office door key, missing from the ring" },
];

// Progress thresholds at which each cue/mark lands (pinned mode).
const STEPS = [0, 0.22, 0.42, 0.62];

function Cue({ p, i, children }: { p: MotionValue<number>; i: number; children: React.ReactNode }) {
  const start = STEPS[i];
  const last = i === CUES.length - 1;
  const end = STEPS[i + 1] ?? 1;
  // Plateau windows that overlap with neighbours; the first greets on load and
  // the last holds. Offsets must stay within [0, 1] (motion's ScrollTimeline throws otherwise).
  const opacity = useTransform(
    p,
    i === 0 ? [0, end - 0.03, end + 0.03] : last ? [start - 0.05, start + 0.02, 1] : [start - 0.05, start + 0.02, end - 0.03, end + 0.03],
    i === 0 ? [1, 1, 0] : last ? [0, 1, 1] : [0, 1, 1, 0],
  );
  const y = useTransform(opacity, [0, 1], [12, 0]);
  return (
    <motion.div style={{ opacity, y }} className="absolute inset-x-0 top-0">
      {children}
    </motion.div>
  );
}

/**
 * Beat 3 (pin, the peak): a statement held on the desk while the marks land
 * one by one; at the contradiction, clue 03 pulls out of the stack. This is
 * the signature: highlighter sweep → the clue it breaks comes forward.
 */
export default function Crack() {
  const scene = useSceneMode();
  const ref = useRef<HTMLElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const inView = useInView(boardRef, { once: true, amount: 0.5 });
  const [step, setStep] = useState(0);

  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });
  useMotionValueEvent(p, "change", (v) => {
    if (!scene) return;
    let s = 0;
    STEPS.forEach((t, i) => { if (v >= t) s = i; });
    setStep(s);
  });

  // Static mode (narrow or reduced motion): play the marks once in view.
  useEffect(() => {
    if (scene || !inView) return;
    const timers = [1, 2, 3].map((s) => setTimeout(() => setStep((cur) => Math.max(cur, s)), s * 650));
    return () => timers.forEach(clearTimeout);
  }, [scene, inView]);

  const caught = step >= 3;

  return (
    <section
      ref={ref}
      aria-labelledby="crack-title"
      className={`border-t border-rule-strong ${scene ? "relative h-[300vh]" : ""}`}
    >
      <div
        className={`${scene ? "sticky top-0 flex h-[100dvh] items-center" : ""} mx-auto max-w-7xl px-[clamp(16px,4vw,48px)] py-[clamp(64px,9vw,112px)] min-[900px]:py-16`}
      >
        <div className="grid w-full gap-8">
          <div className="grid gap-6 min-[900px]:grid-cols-[1fr_1fr] min-[900px]:items-end min-[900px]:gap-16">
            <div className="min-w-0">
              <p className="label">The crack</p>
              <h2 id="crack-title" className="display mt-3 text-[clamp(34px,4.2vw,56px)]">
                One line won&apos;t match the evidence.
              </h2>
            </div>
            {scene ? (
              <div className="relative h-24">
                {CUES.map((c, i) => (
                  <Cue key={c.k} p={p} i={i}>
                    <p className="label">Step {i + 1} of 4 · {c.k}</p>
                    <p className="mt-1.5 max-w-[38ch] text-[22px] leading-snug">{c.t}</p>
                  </Cue>
                ))}
              </div>
            ) : (
              <ol className="space-y-3">
                {CUES.map((c, i) => (
                  <li key={c.k}>
                    <span className="label">Step {i + 1} · {c.k}</span>
                    <p className="text-muted">{c.t}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div ref={boardRef} className="grid min-w-0 gap-5 min-[760px]:grid-cols-[1.55fr_1fr] min-[760px]:gap-8">
            <div className="sheet relative min-w-0 bg-sheet p-6 text-[clamp(19px,1.9vw,28px)] leading-[1.5] min-[900px]:p-10">
              <div className="mb-5 flex flex-wrap justify-between gap-2">
                <span className="label">Interview · Theo Marsh, bandleader</span>
                <span className="label">Q 3 of 10</span>
              </div>
              <p className="mb-4"><span className="label mr-3">Det.</span>Where were you at 11:40, Mr. Marsh?</p>
              <p>
                <span className="label mr-3">Marsh</span>Look, I owed Vivian{" "}
                <Highlight tone="peach" on={step >= 2}>four hundred bucks</Highlight>, everybody knows
                that. But I was on that stage <Highlight on={step >= 3} sweep={420}>till midnight</Highlight>.{" "}
                <Highlight tone="green" on={step >= 1}>Ruby at the bar saw me.</Highlight>
              </p>
            </div>

            <ul className="grid content-start gap-3" aria-label="Clues">
              {CLUES.map((c) => {
                const pulled = caught && c.id === "03";
                return (
                  <li
                    key={c.id}
                    className="sheet relative border-l-4 px-4 py-3 transition-[transform,box-shadow,border-color] duration-500 ease-[var(--ease-out)]"
                    style={{
                      borderLeftColor: pulled ? "var(--hl-red)" : "var(--rule-strong)",
                      transform: pulled ? "translateX(-28px) rotate(-2deg)" : "none",
                      boxShadow: pulled ? "0 24px 36px -18px rgba(163,39,27,.6)" : undefined,
                      transitionDelay: pulled ? "380ms" : "0ms",
                    }}
                  >
                    <span className="label">Clue {c.id}</span>
                    <span className="block text-[17px] leading-snug">{c.text}</span>
                    {c.id === "03" && (
                      <span
                        className="stamp absolute -top-3 right-3 bg-sheet transition-opacity duration-200"
                        style={{ opacity: caught ? 1 : 0, transitionDelay: caught ? "760ms" : "0ms" }}
                        aria-hidden={!caught}
                      >
                        Breaks Marsh&apos;s alibi
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
