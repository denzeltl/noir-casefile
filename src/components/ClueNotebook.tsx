"use client";

import { useGame } from "@/context/GameContext";
import { Search, Fingerprint, MapPin, ZoomIn, Skull } from "lucide-react";
import type { Clue } from "@/types/case";

interface ClueNotebookProps {
  onInspectClue?: (clue: Clue, index: number) => void;
}

export default function ClueNotebook({ onInspectClue }: ClueNotebookProps) {
  const { state } = useGame();
  const c = state.activeCase;
  if (!c) return null;

  return (
    <aside className="border-l border-zinc-800 bg-zinc-950/70 p-4 sm:p-5 w-full flex flex-col gap-4 text-xs">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
        <h2 className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider font-mono">
          <Search className="w-3.5 h-3.5" />
          Clue Locker ({c.clues.length})
        </h2>
        <span className="text-[10px] font-mono text-zinc-400">Click to inspect</span>
      </div>

      {/* Clues List */}
      <div className="space-y-2.5">
        {c.clues.map((clue, i) => (
          <div
            key={clue.id}
            onClick={() => onInspectClue?.(clue, i)}
            className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800 hover:border-amber-600/70 hover:bg-zinc-900 transition-all cursor-pointer group relative shadow-sm"
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-xs font-black text-amber-400">
                  #{i + 1}
                </span>
                <span className="font-bold text-xs text-zinc-200 group-hover:text-amber-100 truncate">
                  {clue.name}
                </span>
              </div>
              <ZoomIn className="w-3.5 h-3.5 text-zinc-400 group-hover:text-amber-400 transition-colors shrink-0" />
            </div>

            <p className="text-[11px] text-zinc-300 leading-relaxed line-clamp-2 pl-4">
              {clue.description}
            </p>

            <div className="flex items-center gap-1 mt-2 text-[10px] font-mono text-zinc-400 pl-4">
              <MapPin className="w-3 h-3 text-amber-500" />
              <span className="truncate">{clue.location}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Crime Scene Setting */}
      <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80">
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-amber-500 uppercase tracking-wider mb-1 font-bold">
          <MapPin className="w-3 h-3" />
          Crime Scene
        </div>
        <p className="text-xs text-zinc-300 leading-relaxed">{c.setting}</p>
      </div>

      {/* Victim Card */}
      <div className="p-3 rounded-xl bg-red-950/20 border border-red-900/40">
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-red-400 uppercase tracking-wider mb-1 font-bold">
          <Skull className="w-3 h-3" />
          Victim Record
        </div>
        <p className="text-xs text-zinc-100 font-bold">{c.victim.name}</p>
        <p className="text-[11px] text-zinc-400">
          Age {c.victim.age} · {c.victim.occupation}
        </p>
        <p className="text-[11px] text-red-300/90 mt-1 font-mono">
          Cause: {c.victim.causeOfDeath}
        </p>
      </div>
    </aside>
  );
}
