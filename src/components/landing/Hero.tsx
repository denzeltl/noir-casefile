"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import Highlight from "@/components/Highlight";
import { useSceneMode } from "./useWide";

interface HeroProps {
  primary: React.ReactNode;
}

/**
 * Beat 1 (scrub): the case file lies stacked on the desk; scrolling fans the
 * papers apart so the coroner's report, the statement and the clue cards each
 * come into view. Copy stays put.
 */
export default function Hero({ primary }: HeroProps) {
  const ref = useRef<HTMLElement>(null);
  const scene = useSceneMode();
  const [marked, setMarked] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMarked(true), 450);
    return () => clearTimeout(t);
  }, []);

  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const reportT = useTransform(p, [0, 0.85], ["translate(0px, 0px) rotate(-2deg)", "translate(-64px, -36px) rotate(-7deg)"]);
  const statementT = useTransform(p, [0, 0.85], ["translate(0px, 0px) rotate(1deg)", "translate(10px, 18px) rotate(0deg)"]);
  const cluesT = useTransform(p, [0, 0.85], ["translate(-40px, 40px) rotate(4deg)", "translate(36px, 108px) rotate(-3deg)"]);
  const cluesO = useTransform(p, [0, 0.35], [0.0, 1]);
  const tagO = useTransform(p, [0.55, 0.8], [0, 1]);

  return (
    <section
      ref={ref}
      aria-labelledby="hero-title"
      className={scene ? "relative h-[230vh]" : "relative"}
    >
      <div
        className={`${scene ? "sticky top-0 min-h-[100dvh]" : ""} mx-auto grid max-w-7xl items-center gap-10 px-[clamp(16px,4vw,48px)] pt-24 pb-16 min-[900px]:grid-cols-[1.05fr_0.95fr] min-[900px]:gap-16 min-[900px]:pt-16 min-[900px]:pb-0`}
      >
        <div className="min-w-0">
          <p className="label">Read it. Mark it. Name the killer.</p>
          <h1 id="hero-title" className="display mt-3 mb-6 text-[clamp(44px,min(7vw,10.5vh),100px)]">
            Solve the murder. Find the <Highlight on={marked}>crack</Highlight> in the alibi.
          </h1>
          <p className="mb-8 max-w-[44ch] text-muted">
            Every case is a fresh file: a victim, a weapon, a handful of clues and a lineup of sworn
            statements. You get a few questions. One statement can&apos;t be true.
          </p>
          {primary}
          <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2" aria-label="Highlighter colours">
            {[
              ["bg-hl-green", "Checks out"],
              ["bg-hl-peach", "Motive"],
              ["bg-hl-red", "Contradiction"],
            ].map(([bg, label]) => (
              <li key={label} className="label inline-flex items-center gap-2">
                <i className={`h-2.5 w-6 rounded-[3px] ${bg}`} aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
        </div>

        {/* Decorative paper stack: the same content is told in the sections below. */}
        <div className="relative mx-auto h-[470px] w-full max-w-[560px] min-[900px]:h-[520px]" aria-hidden="true">
          <motion.div
            style={scene ? { transform: reportT } : { transform: "rotate(-2deg)" }}
            className="sheet absolute top-4 left-0 w-[78%] bg-paper p-5 will-change-transform"
          >
            <p className="label">Coroner&apos;s report · File 0447</p>
            <p className="mt-2 text-[15px] leading-snug text-muted">
              Vivian Hale, 41. Owner, The Lantern Room. Found 11:52 PM in the office. Single blow to
              the head; brass candlestick recovered behind the bar.
            </p>
          </motion.div>

          <motion.div
            style={scene ? { transform: cluesT, opacity: cluesO } : { transform: "translate(0, 40px) rotate(3deg)" }}
            className="absolute right-0 bottom-0 w-[58%] space-y-2 will-change-transform max-[899px]:hidden"
          >
            {["01 · Candlestick, wiped", "02 · IOU, $400, signed T.M.", "03 · Drummer's log, 11:20"].map((c, i) => (
              <div
                key={c}
                className="sheet border-l-4 px-3 py-2 font-mono text-[12px] uppercase tracking-[0.04em] text-muted"
                style={{ borderLeftColor: ["var(--hl-green)", "var(--hl-peach)", "var(--hl-red)"][i] }}
              >
                {c}
              </div>
            ))}
          </motion.div>

          <motion.div
            style={scene ? { transform: statementT } : { transform: "rotate(1deg)" }}
            className="sheet lined absolute top-20 right-2 left-8 px-6 pt-5 pb-16 text-[16px] leading-[32px] will-change-transform min-[900px]:top-24"
          >
            <span className="absolute -top-3 left-1/2 h-14 w-5 rounded-full border-[3px] border-clip" />
            <div className="mb-3 leading-tight">
              <span className="label block">Statement 2 of 4</span>
              <span className="label block">Theo Marsh · bandleader</span>
            </div>
            <p><span className="label mr-2">Det.</span>Where were you at 11:40?</p>
            <p>
              <span className="label mr-2">Marsh</span>I owed her{" "}
              <Highlight tone="peach" on={marked} delay={700}>four hundred bucks</Highlight>, sure.
            </p>
            <p>But I was on that stage till midnight.</p>
            <p><span className="label mr-2">Det.</span>The whole set?</p>
            <p>
              <span className="label mr-2">Marsh</span>
              <Highlight tone="green" on={marked} delay={1300}>Ask Ruby at the bar.</Highlight>
            </p>
            <motion.span style={scene ? { opacity: tagO } : undefined} className="stamp absolute right-5 bottom-5">
              Under review
            </motion.span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
