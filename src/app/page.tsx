"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, MotionConfig, useInView, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import { ArrowRight, ArrowUp } from "lucide-react";
import { useLenis } from "lenis/react";
import { useGame } from "@/context/GameContext";
import DifficultySlider from "@/components/DifficultySlider";
import Hero from "@/components/landing/Hero";
import Files from "@/components/landing/Files";
import Crack from "@/components/landing/Crack";
import Budget from "@/components/landing/Budget";
import Tells from "@/components/landing/Tells";
import SmoothScroll from "@/components/landing/SmoothScroll";
import { RevealGroup, revealColumn, revealItem } from "@/components/landing/Reveal";
import { DIFFICULTY_CONFIGS, type Difficulty } from "@/types/case";

const CONVICTION = [
  { k: "The killer", t: "Name the one suspect whose alibi broke." },
  { k: "The weapon", t: "Say what killed the victim." },
  { k: "The evidence", t: "Explain which clue and which line of testimony prove it." },
];

export default function LandingPage() {
  return (
    <SmoothScroll>
      <Landing />
    </SmoothScroll>
  );
}

function Landing() {
  const { state, dispatch, generateCase } = useGame();
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(state.difficulty || "medium");
  const router = useRouter();
  const reduce = useReducedMotion();
  const lenis = useLenis();

  const hasActiveCase = state.isHydrated && Boolean(state.activeCase && !state.verdict);

  // Nav hides on scroll down and returns on scroll up.
  const { scrollY } = useScroll();
  // Nav hides on scroll down and returns on scroll up, and always shows once
  // the footer is in view so the logo is there to take you back up.
  const [scrolledDown, setScrolledDown] = useState(false);
  const footerRef = useRef<HTMLElement>(null);
  const atFooter = useInView(footerRef, { amount: 0.1 });
  const navHidden = scrolledDown && !atFooter;
  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolledDown(y > 120 && y > prev);
  });

  const handleDifficultyChange = (diff: Difficulty) => {
    setSelectedDifficulty(diff);
    dispatch({ type: "SET_DIFFICULTY", payload: diff });
  };

  const handleLaunchCase = async () => {
    await generateCase(selectedDifficulty);
    router.push("/game");
  };

  const toTop = () => {
    if (lenis) lenis.scrollTo(0, { immediate: Boolean(reduce) });
    else window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  const toOpen = () => {
    const target = document.getElementById("open");
    if (!target) return;
    if (lenis) lenis.scrollTo(target, { offset: -16 });
    else target.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  };

  const heroPrimary = (
    <div className="flex flex-wrap items-center gap-3">
      {hasActiveCase ? (
        <>
          <button
            type="button"
            onClick={() => router.push("/game")}
            className="btn btn-ink inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-md px-6 font-mono text-[14px] font-semibold uppercase"
          >
            Return to your case <ArrowRight className="nudge-right h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={toOpen}
            className="btn btn-quiet inline-flex min-h-12 cursor-pointer items-center rounded-md px-5 font-mono text-[13px] font-semibold uppercase"
          >
            Open a new one
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={toOpen}
          className="btn btn-ink inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-md px-6 font-mono text-[14px] font-semibold uppercase"
        >
          Open a case <ArrowRight className="nudge-right h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );

  return (
    <MotionConfig reducedMotion="user">
    <div className="flex min-h-[100dvh] flex-col">
      <motion.header
        animate={{ transform: navHidden ? "translateY(-100%)" : "translateY(0%)" }}
        transition={{ duration: reduce ? 0 : 0.24, ease: [0.23, 1, 0.32, 1] }}
        className="fixed inset-x-0 top-0 z-40 border-b border-rule-strong bg-desk/95 backdrop-blur-sm"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-[clamp(16px,4vw,48px)] py-2.5">
          <button
            type="button"
            onClick={toTop}
            aria-label="Noir Casefile, back to top"
            className="link-draw label min-h-11 cursor-pointer !text-ink"
          >
            Noir Casefile
          </button>
          {hasActiveCase ? (
            <button
              type="button"
              onClick={() => router.push("/game")}
              className="btn btn-ink inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md px-4 font-mono text-[12px] font-semibold uppercase"
            >
              Return to case <ArrowRight className="nudge-right h-3.5 w-3.5" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={toOpen}
              className="btn btn-quiet inline-flex min-h-11 cursor-pointer items-center rounded-md !border-ink px-4 font-mono text-[12px] font-semibold uppercase"
            >
              Open a case
            </button>
          )}
        </div>
      </motion.header>

      <main>
        <Hero primary={heroPrimary} />
        <Files />
        <Crack />
        <Budget />
        <Tells />

        {/* Beat 6 (flow): the close. How you win, then open a file. */}
        <section id="open" aria-labelledby="open-title" className="scroll-mt-16 border-t border-rule-strong bg-paper">
          <RevealGroup className="mx-auto grid max-w-7xl gap-10 px-[clamp(16px,4vw,48px)] py-[clamp(64px,9vw,112px)] min-[900px]:grid-cols-[0.85fr_1.15fr] min-[900px]:gap-16">
            <motion.div variants={revealColumn} className="min-w-0">
              <motion.p variants={revealItem} className="label">The verdict</motion.p>
              <motion.h2 variants={revealItem} id="open-title" className="display mt-3 text-[clamp(34px,4.2vw,56px)]">
                A conviction takes three things.
              </motion.h2>
              <motion.ol variants={revealColumn} className="mt-8 space-y-5">
                {CONVICTION.map((c, i) => (
                  <motion.li variants={revealItem} key={c.k} className="grid grid-cols-[auto_1fr] gap-x-4">
                    <span className="font-mono text-[15px] tabular-nums text-muted">0{i + 1}</span>
                    <div>
                      <p className="text-[22px] leading-tight">{c.k}</p>
                      <p className="mt-1 text-muted">{c.t}</p>
                    </div>
                  </motion.li>
                ))}
              </motion.ol>
              <motion.p variants={revealItem} className="mt-8 max-w-[44ch] text-muted">
                Get all three right and the judge convicts. Spot the crack early and you can file before
                your questions run out.
              </motion.p>
            </motion.div>

            <motion.div variants={revealItem} className="min-w-0 space-y-4">
              {state.error && (
                <p role="alert" className="border-l-4 border-pen bg-sheet px-4 py-3 text-[16px]">
                  <span className="label !text-pen mr-2">Couldn&apos;t open the file</span>
                  {state.error}
                </p>
              )}

              {hasActiveCase && state.activeCase && (
                <div className="sheet bg-sheet p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="label">Case in progress</span>
                    <span className="label">{DIFFICULTY_CONFIGS[state.difficulty]?.label || state.difficulty}</span>
                  </div>
                  <p className="mt-2 text-[22px] leading-tight [overflow-wrap:anywhere]">{state.activeCase.title}</p>
                  <p className="mt-1 text-[16px] text-muted [overflow-wrap:anywhere]">
                    Victim: {state.activeCase.victim.name} ·{" "}
                    <span className="font-mono tabular-nums text-ink">{state.questionsRemaining}</span> questions left
                  </p>
                </div>
              )}

              <DifficultySlider
                difficulty={selectedDifficulty}
                onChange={handleDifficultyChange}
                onLaunch={handleLaunchCase}
                onResume={() => router.push("/game")}
                hasActiveCase={hasActiveCase}
                isLoading={state.isLoading}
              />
            </motion.div>
          </RevealGroup>
        </section>
      </main>

      <footer ref={footerRef} className="border-t border-rule-strong">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-[clamp(16px,4vw,48px)] py-8">
          <span className="label">Noir Casefile · a procedural murder mystery</span>
          <span className="label">Every case, name and figure on this page is invented.</span>
          <button
            type="button"
            onClick={toTop}
            className="btn link-draw label inline-flex min-h-11 cursor-pointer items-center gap-1.5 !text-ink"
          >
            <ArrowUp className="nudge-up h-3.5 w-3.5" aria-hidden="true" />
            Back to top
          </button>
        </div>
      </footer>
    </div>
    </MotionConfig>
  );
}
