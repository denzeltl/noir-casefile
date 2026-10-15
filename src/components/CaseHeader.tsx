"use client";

import { useGame } from "@/context/GameContext";
import { Skull, BookOpen, MessageCircle, Gavel } from "lucide-react";
import { DIFFICULTY_CONFIGS } from "@/types/case";

const difficultyBadgeStyles = {
  easy: "text-emerald-400 bg-emerald-950/60 border-emerald-800/50",
  medium: "text-amber-400 bg-amber-950/60 border-amber-800/50",
  hard: "text-orange-400 bg-orange-950/60 border-orange-800/50",
  noir: "text-purple-400 bg-purple-950/60 border-purple-800/50",
};

export default function CaseHeader() {
  const { state, dispatch } = useGame();
  const c = state.activeCase;
  if (!c) return null;

  const diffConfig = DIFFICULTY_CONFIGS[state.difficulty] || DIFFICULTY_CONFIGS.medium;
  const badgeStyle = difficultyBadgeStyles[state.difficulty] || difficultyBadgeStyles.medium;

  return (
    <header className="border-b border-amber-900/30 bg-zinc-950/80 backdrop-blur px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
        {/* Title, difficulty badge & victim */}
        <div className="flex items-center gap-3 min-w-0">
          <Skull className="text-red-500 shrink-0" size={24} />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-amber-100 truncate">
                {c.title}
              </h1>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${badgeStyle}`}
              >
                {diffConfig.label}
              </span>
            </div>
            <p className="text-xs text-zinc-400 truncate mt-0.5">
              Victim: {c.victim.name} — {c.victim.causeOfDeath}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-5 text-sm shrink-0">
          <span className="flex items-center gap-1.5 text-zinc-300">
            <BookOpen size={16} className="text-amber-500" />
            {c.clues.length} Clues
          </span>
          <span className="flex items-center gap-1.5 text-zinc-300">
            <MessageCircle size={16} className="text-amber-500" />
            <span
              className={
                state.questionsRemaining <= 3
                  ? "text-red-400 font-bold"
                  : ""
              }
            >
              {state.questionsRemaining}
            </span>{" "}
            Qs left
          </span>
          <button
            onClick={() =>
              dispatch({ type: "SHOW_ACCUSATION", payload: true })
            }
            className="flex items-center gap-1.5 bg-red-700 hover:bg-red-600 text-white text-sm font-semibold px-4 py-1.5 rounded transition-colors"
          >
            <Gavel size={16} />
            Accuse
          </button>
        </div>
      </div>
    </header>
  );
}
