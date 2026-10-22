"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Tone } from "@/components/Highlight";

/**
 * Optional highlighter marks the player puts on suspects' answers. Purely a
 * reading aid: nothing in the game reads them, and the case can be solved
 * without marking anything. Saved per case in localStorage.
 */

const STORAGE_KEY = "noir_casefile_marks_v1";

export interface AnswerMark {
  tone: Tone;
  /** For contradictions: the clue the answer breaks. */
  clueId?: string;
}

/** Key for one answer: `${suspectId}:${messageIndex}`. */
export const markKey = (suspectId: string, index: number) => `${suspectId}:${index}`;

interface MarksValue {
  marks: Record<string, AnswerMark>;
  setMark: (key: string, mark: AnswerMark | null) => void;
  /** The clue most recently cited by a contradiction; the notebook pulls it forward. */
  pulledClueId: string | null;
}

const MarksContext = createContext<MarksValue | null>(null);

export function MarksProvider({ caseId, children }: { caseId: string; children: React.ReactNode }) {
  // Mounted with key={caseId}, so a new case starts from its own saved marks.
  const [marks, setMarks] = useState<Record<string, AnswerMark>>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      return saved?.caseId === caseId ? saved.marks ?? {} : {};
    } catch {
      return {};
    }
  });
  const [pulledClueId, setPulledClueId] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ caseId, marks }));
    } catch {
      // Marks are a convenience; losing them is acceptable.
    }
  }, [marks, caseId]);

  // The pull-forward is a moment, not a state: let the clue settle back.
  useEffect(() => {
    if (!pulledClueId) return;
    const t = setTimeout(() => setPulledClueId(null), 2400);
    return () => clearTimeout(t);
  }, [pulledClueId]);

  const setMark = useCallback((key: string, mark: AnswerMark | null) => {
    setMarks((prev) => {
      const next = { ...prev };
      if (mark) next[key] = mark;
      else delete next[key];
      return next;
    });
    if (mark?.tone === "red" && mark.clueId) setPulledClueId(mark.clueId);
  }, []);

  const value = useMemo(() => ({ marks, setMark, pulledClueId }), [marks, setMark, pulledClueId]);
  return <MarksContext.Provider value={value}>{children}</MarksContext.Provider>;
}

export function useMarks() {
  const ctx = useContext(MarksContext);
  if (!ctx) throw new Error("useMarks must be used inside MarksProvider");
  return ctx;
}
