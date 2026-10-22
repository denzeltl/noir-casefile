"use client";

import { useEffect, useRef } from "react";
import { useGame } from "@/context/GameContext";
import { useMarks } from "@/context/MarksContext";
import type { Clue } from "@/types/case";

interface ClueNotebookProps {
  onInspectClue?: (clue: Clue, index: number) => void;
}

/**
 * The evidence beside the transcript. When the player marks an answer as
 * contradicting a clue, that clue's card pulls forward (the signature) and
 * keeps a red edge with the names of who it catches.
 */
export default function ClueNotebook({ onInspectClue }: ClueNotebookProps) {
  const { state } = useGame();
  const { marks, pulledClueId } = useMarks();
  const refs = useRef<Record<string, HTMLLIElement | null>>({});
  const c = state.activeCase;

  useEffect(() => {
    if (pulledClueId) refs.current[pulledClueId]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [pulledClueId]);

  if (!c) return null;

  const citedBy = (clueId: string) => {
    const ids = new Set(
      Object.entries(marks)
        .filter(([, m]) => m.tone === "red" && m.clueId === clueId)
        .map(([k]) => k.split(":")[0]),
    );
    return c.suspects.filter((s) => ids.has(s.id)).map((s) => s.name);
  };

  return (
    <aside className="flex w-full flex-col gap-5 p-4 sm:p-5" aria-label="Evidence">
      <div className="flex items-baseline justify-between gap-2 border-b border-rule-strong pb-2">
        <h2 className="label !text-ink">Evidence · {c.clues.length} clues</h2>
        <span className="label">Tap to inspect</span>
      </div>

      <ul className="space-y-2.5">
        {c.clues.map((clue, i) => {
          const pulled = pulledClueId === clue.id;
          const names = citedBy(clue.id);
          return (
            <li
              key={clue.id}
              ref={(el) => { refs.current[clue.id] = el; }}
              className="transition-transform duration-300 ease-[var(--ease-out)]"
              style={{ transform: pulled ? "translateX(-12px) rotate(-1deg)" : "none" }}
            >
              <button
                type="button"
                onClick={() => onInspectClue?.(clue, i)}
                className={`card-lift block w-full cursor-pointer border border-l-4 bg-sheet p-3 text-left hover:border-muted ${
                  names.length ? "border-l-hl-red" : "border-l-rule-strong"
                } ${pulled ? "border-pen shadow-[0_18px_30px_-16px_rgba(163,39,27,.55)]" : "border-rule-strong"}`}
              >
                <span className="label">Clue {String(i + 1).padStart(2, "0")} · {clue.location}</span>
                <span className="mt-1 block text-[17px] leading-snug [overflow-wrap:anywhere]">{clue.name}</span>
                <span className="mt-1 line-clamp-2 block text-[15px] leading-snug text-muted">{clue.description}</span>
                {names.length > 0 && (
                  <span className="mt-2 block font-mono text-[12px] leading-snug text-pen [overflow-wrap:anywhere]">
                    ✗ Breaks what {names.join(", ")} said
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <section className="border-t border-rule-strong pt-4">
        <h3 className="label">Scene</h3>
        <p className="mt-1 text-[15px] leading-snug [overflow-wrap:anywhere]">{c.setting}</p>
      </section>

      <section className="border-t border-rule-strong pt-4">
        <h3 className="label">Victim</h3>
        <p className="mt-1 text-[17px] leading-tight [overflow-wrap:anywhere]">{c.victim.name}</p>
        <p className="text-[15px] text-muted [overflow-wrap:anywhere]">
          Age {c.victim.age} · {c.victim.occupation}
        </p>
        <p className="mt-1 text-[15px] [overflow-wrap:anywhere]">
          <span className="label mr-2">Cause</span>
          {c.victim.causeOfDeath}
        </p>
      </section>
    </aside>
  );
}
