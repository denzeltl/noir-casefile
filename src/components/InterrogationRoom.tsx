"use client";

import { useState, useRef, useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useGame } from "@/context/GameContext";
import { useMarks, markKey } from "@/context/MarksContext";
import Highlight, { TONE_LABEL, type Tone } from "@/components/Highlight";
import { ArrowUp, FileText, Lock } from "lucide-react";
import type { Clue, Suspect } from "@/types/case";

interface InterrogationRoomProps {
  onOpenDossier?: (suspect: Suspect) => void;
}

const QUICK_PROMPTS = [
  "Where were you around the time of the murder?",
  "Can anyone corroborate your alibi?",
  "What was your true relationship with the victim?",
  "Did you have any disagreements with the victim?",
];

const TONES: Tone[] = ["green", "peach", "red"];
const TONE_BG: Record<Tone, string> = { green: "bg-hl-green", peach: "bg-hl-peach", red: "bg-hl-red" };

const surname = (name: string) => name.trim().split(/\s+/).at(-1) ?? name;

export default function InterrogationRoom({ onOpenDossier }: InterrogationRoomProps) {
  const { state, dispatch, interrogate } = useGame();
  const [input, setInput] = useState("");
  const logRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const suspect = state.activeCase?.suspects.find((s) => s.id === state.activeSuspectId);
  const chatHistory = suspect ? state.chatHistories[suspect.id] || [] : [];
  const canAsk = state.questionsRemaining > 0 && !state.isLoading;
  const waiting = state.isLoading && state.activeSuspectId === suspect?.id;

  // Keep the newest line in view.
  useEffect(() => {
    const el = logRef.current;
    if (el && (chatHistory.length > 0 || waiting)) el.scrollTo({ top: el.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [chatHistory.length, waiting, reduce]);

  const ask = async (question: string) => {
    if (!suspect || !canAsk || !question.trim()) return;
    await interrogate(suspect.id, question.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = input;
    setInput("");
    await ask(q);
  };

  if (!suspect) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="max-w-sm text-center">
          <p className="label">Interview room</p>
          <h3 className="mt-2 text-[22px]">Nobody in the chair yet.</h3>
          <p className="mt-1 text-muted">Pick a suspect from the lineup to bring them in.</p>
        </div>
      </div>
    );
  }

  const label = surname(suspect.name);

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
      {/* Who is in the chair */}
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-3 border-b border-rule-strong bg-paper px-4 py-3 sm:px-6">
        <div className="min-w-[12rem] flex-1">
          <p className="label">In the chair · age {suspect.age}</p>
          <h2 className="text-[22px] leading-tight [overflow-wrap:anywhere]">{suspect.name}</h2>
          <p className="text-[15px] leading-snug text-muted [overflow-wrap:anywhere] max-sm:line-clamp-2">
            {suspect.occupation} · {suspect.relationshipToVictim}
          </p>
        </div>
        {onOpenDossier && (
          <button
            type="button"
            onClick={() => onOpenDossier(suspect)}
            title="Full file"
            className="btn btn-quiet inline-flex min-h-11 max-w-[40%] min-w-0 cursor-pointer items-center gap-1.5 rounded-md px-3 font-mono text-[12px] uppercase"
          >
            <FileText className="tilt h-3.5 w-3.5 shrink-0" aria-hidden="true" /> <span className="truncate">Full file</span>
          </button>
        )}
      </div>

      {/* Transcript */}
      <div ref={logRef} className="min-h-0 flex-1 overflow-y-auto bg-paper px-4 py-5 sm:px-6">
        <div className="mx-auto max-w-[68ch]">
          <section aria-label="Sworn statement" className="sheet mb-6 bg-sheet p-4">
            <p className="label">Sworn statement · their alibi</p>
            <p className="mt-1 text-[17px] italic leading-relaxed [overflow-wrap:anywhere]">
              &ldquo;{suspect.alibi}&rdquo;
            </p>
          </section>

          {chatHistory.length === 0 && !waiting ? (
            <div className="py-4">
              <p className="text-[17px]">
                Nothing on the record yet. Every question you ask here comes out of the shared budget.
              </p>
              <p className="label mt-5 mb-2">Common openers</p>
              <ul className="space-y-2">
                {QUICK_PROMPTS.map((prompt) => (
                  <li key={prompt}>
                    <button
                      type="button"
                      onClick={() => ask(prompt)}
                      disabled={!canAsk}
                      className="group flex min-h-11 w-full cursor-pointer items-center gap-3 border-b border-rule-strong py-2 text-left text-[17px] transition-colors duration-150 hover:border-ink disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span className="label shrink-0 transition-[color,transform] duration-150 ease-[var(--ease-out)] group-hover:translate-x-1 group-hover:text-ink">Ask</span>
                      <span className="min-w-0">{prompt}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <ol className="space-y-4" aria-label={`Transcript with ${suspect.name}`}>
              {chatHistory.map((msg, i) => (
                <motion.li
                  key={i}
                  initial={reduce ? false : { opacity: 0, transform: "translateY(6px)" }}
                  animate={{ opacity: 1, transform: "translateY(0px)" }}
                  transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                  className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-3 sm:grid-cols-[6rem_minmax(0,1fr)]"
                >
                  {msg.role === "user" ? (
                    <>
                      <span className="label pt-1.5">Det.</span>
                      <p className="text-[17px] leading-relaxed text-muted [overflow-wrap:anywhere]">{msg.content}</p>
                    </>
                  ) : (
                    <Answer suspectId={suspect.id} index={i} speaker={label} text={msg.content} clues={state.activeCase?.clues ?? []} />
                  )}
                </motion.li>
              ))}
              {waiting && (
                <li className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-3 sm:grid-cols-[6rem_minmax(0,1fr)]" role="status">
                  <span className="label truncate pt-1.5">{label}</span>
                  <p className="text-[17px] text-muted">
                    <span className="italic">considers the question</span>
                    <span className="ml-1 inline-block h-[1.05em] w-[2px] translate-y-[3px] animate-pulse bg-ink" aria-hidden="true" />
                  </p>
                </li>
              )}
            </ol>
          )}
        </div>
      </div>

      {/* Ask, or the budget is spent */}
      <div className="shrink-0 border-t border-rule-strong bg-paper px-4 py-3 sm:px-6">
        {state.questionsRemaining <= 0 ? (
          <div className="mx-auto flex max-w-[68ch] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-[16px]">
              <Lock className="h-4 w-4 shrink-0 text-pen" aria-hidden="true" />
              No questions left. Time to name the killer.
            </p>
            <button
              type="button"
              onClick={() => dispatch({ type: "SHOW_ACCUSATION", payload: true })}
              className="btn btn-ink min-h-11 cursor-pointer rounded-md px-5 font-mono text-[13px] font-semibold uppercase"
            >
              File accusation
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mx-auto flex max-w-[68ch] items-end gap-3">
            <label className="min-w-0 flex-1 overflow-hidden">
              <span className="label block truncate" title={`Question for ${suspect.name}`}>Question for {label} · {state.questionsRemaining} left</span>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                maxLength={500}
                placeholder={`Ask ${suspect.name}…`}
                disabled={!canAsk}
                className="field mt-1 block w-full border-0 border-b-2 border-rule-strong bg-transparent py-2 text-[17px] placeholder:text-muted disabled:opacity-60"
              />
            </label>
            <button
              type="submit"
              disabled={!canAsk || !input.trim()}
              className="btn btn-ink inline-flex min-h-11 max-w-[40%] cursor-pointer items-center gap-1.5 rounded-md px-4 font-mono text-[13px] font-semibold uppercase disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowUp className="nudge-up h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">Ask</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

/** One answer on the record, with the optional highlighter tray. */
function Answer({ suspectId, index, speaker, text, clues }: { suspectId: string; index: number; speaker: string; text: string; clues: Clue[] }) {
  const { marks, setMark } = useMarks();
  const key = markKey(suspectId, index);
  const mark = marks[key];
  const [choosingClue, setChoosingClue] = useState(false);
  const [trayOpen, setTrayOpen] = useState(false);
  const cited = mark?.clueId ? clues.findIndex((c) => c.id === mark.clueId) : -1;

  const pick = (tone: Tone) => {
    if (mark?.tone === tone) {
      setMark(key, null);
      setChoosingClue(false);
      return;
    }
    setMark(key, { tone });
    const needsClue = tone === "red" && clues.length > 0;
    setChoosingClue(needsClue);
    if (!needsClue) setTrayOpen(false);
  };

  return (
    <>
      <span className="label truncate pt-1.5" title={speaker}>{speaker}</span>
      <div className="min-w-0">
        <p className="text-[17px] leading-relaxed [overflow-wrap:anywhere]">
          <Highlight tone={mark?.tone ?? "red"} on={Boolean(mark)} sweep={480}>{text}</Highlight>
        </p>

        {trayOpen ? (
          <div className="mt-1.5 flex flex-wrap items-center gap-x-1" role="group" aria-label="Mark this answer (optional)">
            {TONES.map((t) => {
              const active = mark?.tone === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => pick(t)}
                  aria-pressed={active}
                  title={active ? "Remove mark" : `Mark: ${TONE_LABEL[t]}`}
                  className={`group -my-1.5 inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-sm px-1.5 font-mono text-[11px] uppercase tracking-[0.04em] transition-colors duration-150 ${active ? "text-ink" : "text-muted hover:text-ink"}`}
                >
                  <i
                    className={`block h-2.5 w-5 rounded-[3px] ${TONE_BG[t]} transition-transform duration-150 ease-[var(--ease-out)] ${active ? "scale-110 ring-1 ring-ink/40" : "opacity-70 group-hover:scale-110 group-hover:opacity-100"}`}
                    aria-hidden="true"
                  />
                  {TONE_LABEL[t]}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setTrayOpen(false)}
              className="btn -my-1.5 min-h-11 cursor-pointer px-1.5 font-mono text-[11px] uppercase text-muted hover:text-ink"
            >
              Done
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setTrayOpen(true)}
            aria-expanded={false}
            className="btn group -my-1.5 inline-flex min-h-11 cursor-pointer items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.04em] text-muted hover:text-ink"
          >
            {mark ? (
              <>
                <i className={`block h-2.5 w-5 rounded-[3px] ${TONE_BG[mark.tone]}`} aria-hidden="true" />
                {TONE_LABEL[mark.tone]} · edit
              </>
            ) : (
              <>
                <i className="block h-2.5 w-0 rounded-[3px] bg-hl-red/70 transition-[width] duration-200 ease-[var(--ease-sweep)] group-hover:w-5" aria-hidden="true" />
                Mark
              </>
            )}
          </button>
        )}

        {mark?.tone === "red" && (choosingClue || cited < 0) && clues.length > 0 && (
          <div className="mt-2 border-l-2 border-pen pl-3">
            <p className="label !text-pen">Which clue does it break? (optional)</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {clues.map((c, ci) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setMark(key, { tone: "red", clueId: c.id });
                    setChoosingClue(false);
                    setTrayOpen(false);
                  }}
                  className="btn btn-quiet min-h-11 max-w-full cursor-pointer truncate rounded-sm bg-sheet px-2 font-mono text-[11px] uppercase"
                  title={c.name}
                >
                  {String(ci + 1).padStart(2, "0")} · {c.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {mark?.tone === "red" && cited >= 0 && !choosingClue && (
          <motion.div
            initial={{ opacity: 0, transform: "translateX(8px)" }}
            animate={{ opacity: 1, transform: "translateX(0px)" }}
            transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
            className="mt-2 border border-l-4 border-rule-strong border-l-hl-red bg-sheet p-2.5 lg:hidden"
          >
            <span className="label">Clue {String(cited + 1).padStart(2, "0")} · {clues[cited].location}</span>
            <span className="block text-[15px] leading-snug [overflow-wrap:anywhere]">{clues[cited].name}</span>
            <span className="line-clamp-2 block text-[14px] leading-snug text-muted">{clues[cited].description}</span>
          </motion.div>
        )}
        {mark?.tone === "red" && cited >= 0 && !choosingClue && (
          <p className="mt-1 font-mono text-[12px] leading-snug text-pen [overflow-wrap:anywhere]">
            ✗ Contradicts clue {String(cited + 1).padStart(2, "0")}: {clues[cited].name}{" "}
            <button type="button" onClick={() => setChoosingClue(true)} className="cursor-pointer underline underline-offset-2">
              change
            </button>
          </p>
        )}
      </div>
    </>
  );
}
