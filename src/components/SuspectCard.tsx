"use client";

import { useEffect, useRef, useState } from "react";
import { useGame } from "@/context/GameContext";
import { useMarks } from "@/context/MarksContext";
import { FileText } from "lucide-react";
import type { Suspect } from "@/types/case";

interface SuspectCardProps {
  suspect: Suspect;
  onSelect?: (suspectId: string) => void;
  onOpenDossier?: (suspect: Suspect) => void;
}

/** An index card in the lineup. The active card is pulled out of the stack. */
export default function SuspectCard({ suspect, onSelect, onOpenDossier }: SuspectCardProps) {
  const { state, dispatch } = useGame();
  const { marks } = useMarks();

  const isActive = state.activeSuspectId === suspect.id;
  const asked = (state.chatHistories[suspect.id] || []).filter((m) => m.role === "user").length;
  const contradictions = Object.entries(marks).filter(([k, m]) => k.startsWith(`${suspect.id}:`) && m.tone === "red").length;

  // The count ticks when a question lands on this suspect.
  const [bumped, setBumped] = useState(false);
  const prev = useRef(asked);
  useEffect(() => {
    if (asked > prev.current) {
      setBumped(true);
      const t = setTimeout(() => setBumped(false), 160);
      prev.current = asked;
      return () => clearTimeout(t);
    }
    prev.current = asked;
  }, [asked]);

  const select = () => {
    dispatch({ type: "SELECT_SUSPECT", payload: suspect.id });
    onSelect?.(suspect.id);
  };

  return (
    <div
      className={`relative border bg-sheet ${
        isActive
          ? "translate-x-1.5 border-ink shadow-sheet transition-[transform,box-shadow,border-color] duration-200 ease-[var(--ease-out)]"
          : "card-lift border-rule-strong hover:border-muted"
      }`}
    >
      {/* Index-card tab colour: red once the player has marked a contradiction. */}
      <span
        className={`absolute inset-y-0 left-0 w-1 transition-colors duration-200 ${contradictions ? "bg-hl-red" : isActive ? "bg-ink" : "bg-transparent"}`}
        aria-hidden="true"
      />
      <button
        type="button"
        onClick={select}
        aria-pressed={isActive}
        className="block w-full cursor-pointer px-4 pt-3 pb-3 pr-12 text-left active:translate-y-px"
      >
        <span className="block text-[18px] leading-tight [overflow-wrap:anywhere]">{suspect.name}</span>
        <span className="mt-0.5 block text-[14px] leading-snug text-muted [overflow-wrap:anywhere]">{suspect.occupation}</span>
        <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="label truncate">{suspect.relationshipToVictim}</span>
          <span
            className={`label inline-block tabular-nums transition-transform duration-150 ${asked ? "!text-ink" : ""}`}
            style={{ transform: bumped ? "scale(1.12)" : "scale(1)" }}
          >
            {asked ? `${asked} asked` : "Not questioned"}
          </span>
          {contradictions > 0 && <span className="label !text-pen">{contradictions} marked</span>}
        </span>
      </button>
      {onOpenDossier && (
        <button
          type="button"
          onClick={() => onOpenDossier(suspect)}
          aria-label={`Open ${suspect.name}'s file`}
          title="Open full file"
          className="btn absolute top-1 right-1 flex h-11 w-11 cursor-pointer items-center justify-center text-muted hover:text-ink"
        >
          <FileText className="tilt h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
