"use client";

import { motion } from "motion/react";
import { RevealGroup, revealItem as child } from "./Reveal";

const SAMPLE_FILES = [
  {
    no: "0447",
    title: "The Lantern Room",
    victim: "Vivian Hale, 41, club owner",
    weapon: "Brass candlestick",
    scene: "Back office of a jazz club, 11:52 PM",
  },
  {
    no: "0448",
    title: "Cold Storage, Pier 9",
    victim: "Arthur Penhaligon, 58, shipping clerk",
    weapon: "Cargo hook",
    scene: "Locked freezer room, found at the 6 AM shift",
  },
  {
    no: "0449",
    title: "The Ashcroft Reading Room",
    victim: "Dr. Mae Okonkwo, 36, rare-books curator",
    weapon: "Laudanum in the tea service",
    scene: "Private library, doors bolted from inside",
  },
];

/** Beat 2 (flow): every case is generated fresh. */
export default function Files() {
  return (
    <section aria-labelledby="files-title" className="border-t border-rule-strong bg-paper">
      <div className="mx-auto max-w-7xl px-[clamp(16px,4vw,48px)] py-[clamp(64px,9vw,112px)]">
        <RevealGroup>
          <motion.p variants={child} className="label">Every file is new</motion.p>
          <motion.h2 variants={child} id="files-title" className="display mt-3 max-w-[18ch] text-[clamp(34px,4.2vw,56px)]">
            No two cases are the same murder.
          </motion.h2>
          <motion.p variants={child} className="mt-4 max-w-[52ch] text-muted">
            Open a case and the file is written on the spot: who died, how, where, the clues left
            behind, and every suspect&apos;s alibi. Exactly one suspect did it, and their alibi has a
            flaw. A few examples:
          </motion.p>

          <ul className="mt-12 grid gap-5 min-[760px]:grid-cols-3">
            {SAMPLE_FILES.map((f, i) => (
              <motion.li
                key={f.no}
                variants={child}
                className="sheet relative min-w-0 bg-sheet p-5"
                style={{ rotate: `${[-0.8, 0.6, -0.4][i]}deg` }}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="label">File {f.no}</span>
                  <span className="label">Example</span>
                </div>
                <h3 className="mt-3 text-[22px] leading-tight [overflow-wrap:anywhere] [text-wrap:balance]">{f.title}</h3>
                <dl className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-[15px] leading-snug">
                  <dt className="label pt-0.5">Victim</dt>
                  <dd>{f.victim}</dd>
                  <dt className="label pt-0.5">Weapon</dt>
                  <dd>{f.weapon}</dd>
                  <dt className="label pt-0.5">Scene</dt>
                  <dd>{f.scene}</dd>
                </dl>
              </motion.li>
            ))}
          </ul>
        </RevealGroup>
      </div>
    </section>
  );
}
