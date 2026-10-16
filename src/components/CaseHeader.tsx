"use client";

import { useGame } from "@/context/GameContext";
import { Skull, MessageCircle, Gavel, FileText, ArrowLeft } from "lucide-react";
import { DIFFICULTY_CONFIGS } from "@/types/case";
import { useRouter } from "next/navigation";

const difficultyBadgeStyles = {
  easy: "text-emerald-400 bg-emerald-950/60 border-emerald-800/60",
  medium: "text-amber-400 bg-amber-950/60 border-amber-800/60",
  hard: "text-orange-400 bg-orange-950/60 border-orange-800/60",
  noir: "text-purple-400 bg-purple-950/60 border-purple-800/60",
};

export default function CaseHeader() {
  const { state, dispatch } = useGame();
  const router = useRouter();
  const c = state.activeCase;
  if (!c) return null;

  const diffConfig = DIFFICULTY_CONFIGS[state.difficulty] || DIFFICULTY_CONFIGS.medium;
  const badgeStyle = difficultyBadgeStyles[state.difficulty] || difficultyBadgeStyles.medium;
  const isLowOnQuestions = state.questionsRemaining <= 3;

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md px-3 sm:px-6 py-2.5 sm:py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
        {/* Title, Back & Victim Info */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <button
            onClick={() => router.push("/")}
            title="Return to Case Archives"
            className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="w-8 h-8 rounded-lg bg-red-950 border border-red-800/80 flex items-center justify-center shrink-0">
            <Skull className="w-4 h-4 text-red-500" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-sm sm:text-base font-bold text-zinc-100 truncate max-w-[220px] sm:max-w-md">
                {c.title}
              </h1>
              <span
                className={`text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${badgeStyle}`}
              >
                {diffConfig.label}
              </span>
            </div>
            <p className="text-xs text-zinc-300 truncate mt-0.5 font-mono">
              Victim: <span className="text-zinc-300 font-medium">{c.victim.name}</span> ({c.victim.causeOfDeath})
            </p>
          </div>
        </div>

        {/* Actions & Question Budget */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Re-open Case Briefing Dossier */}
          <button
            onClick={() => dispatch({ type: "SHOW_BRIEFING", payload: true })}
            className="flex items-center gap-1.5 text-xs font-mono text-amber-300 bg-amber-950/40 hover:bg-amber-900/40 border border-amber-800/60 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Case</span> Dossier
          </button>

          {/* Question Limit Badge */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
              isLowOnQuestions
                ? "bg-red-950/60 border-red-700/80 text-red-300 animate-pulse"
                : "bg-zinc-900 border-zinc-800 text-zinc-300"
            }`}
          >
            <MessageCircle className={`w-3.5 h-3.5 ${isLowOnQuestions ? "text-red-400" : "text-amber-500"}`} />
            <span>
              <strong className={isLowOnQuestions ? "text-red-200 font-bold" : "text-zinc-100 font-bold"}>
                {state.questionsRemaining}
              </strong>{" "}
              <span className="hidden sm:inline">Qs Left</span>
            </span>
          </div>

          {/* Accuse / Indict Button */}
          <button
            onClick={() => dispatch({ type: "SHOW_ACCUSATION", payload: true })}
            className="flex items-center gap-1.5 bg-red-700 hover:bg-red-600 active:scale-95 text-white text-xs sm:text-sm font-mono font-bold uppercase tracking-wider px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl transition-all shadow-md cursor-pointer"
          >
            <Gavel className="w-3.5 h-3.5 text-red-200" />
            <span>Accuse</span>
          </button>
        </div>
      </div>
    </header>
  );
}
