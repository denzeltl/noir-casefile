"use client";

import { useGame } from "@/context/GameContext";
import { User, ShieldAlert, ShieldCheck, FileText } from "lucide-react";
import type { Suspect } from "@/types/case";

interface SuspectCardProps {
  suspect: Suspect;
  onOpenDossier?: (suspect: Suspect) => void;
}

export default function SuspectCard({ suspect, onOpenDossier }: SuspectCardProps) {
  const { state, dispatch } = useGame();

  const isActive = state.activeSuspectId === suspect.id;
  const messageCount = (state.chatHistories[suspect.id] || []).filter(
    (m) => m.role === "user"
  ).length;

  return (
    <div
      onClick={() => dispatch({ type: "SELECT_SUSPECT", payload: suspect.id })}
      className={`w-full text-left rounded-xl border p-3.5 sm:p-4 transition-all duration-200 cursor-pointer relative group ${
        isActive
          ? "border-amber-500/80 bg-amber-950/25 shadow-lg shadow-amber-950/40 ring-1 ring-amber-500/30"
          : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-900"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Silhouette Avatar */}
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
            isActive
              ? "bg-amber-950/80 border-amber-600/70 text-amber-300"
              : "bg-zinc-950 border-zinc-800 text-zinc-400 group-hover:text-zinc-200"
          }`}
        >
          <User className="w-5 h-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <h3 className={`font-bold text-sm truncate ${isActive ? "text-amber-100" : "text-zinc-200"}`}>
              {suspect.name}
            </h3>
            {onOpenDossier && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDossier(suspect);
                }}
                title="View Full Police Dossier"
                className="text-zinc-400 hover:text-amber-300 p-1 rounded hover:bg-zinc-800/80 transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <p className="text-xs text-zinc-300 truncate">{suspect.occupation}</p>
          <p className="text-xs text-zinc-300 mt-1 line-clamp-1 italic font-serif">
            &quot;{suspect.alibi}&quot;
          </p>
        </div>
      </div>

      {/* Relationship & Status Bar */}
      <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono">
        <span className="text-zinc-300 truncate max-w-[55%]">
          {suspect.relationshipToVictim}
        </span>
        <span className="flex items-center gap-1 shrink-0">
          {messageCount > 0 ? (
            <>
              <ShieldAlert className="w-3 h-3 text-amber-400" />
              <span className="text-amber-400 font-bold">{messageCount} Qs Asked</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-3 h-3 text-zinc-300" />
              <span className="text-zinc-300">Untested</span>
            </>
          )}
        </span>
      </div>
    </div>
  );
}
