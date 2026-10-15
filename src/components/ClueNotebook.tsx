"use client";

import { useGame } from "@/context/GameContext";
import { Search, Fingerprint, MapPin } from "lucide-react";

export default function ClueNotebook() {
  const { state } = useGame();
  const c = state.activeCase;
  if (!c) return null;

  return (
    <aside className="border-l border-amber-900/30 bg-zinc-950/60 p-5 w-full">
      {/* Section header */}
      <h2 className="flex items-center gap-2 text-amber-400 font-bold text-sm uppercase tracking-wider mb-4">
        <Search size={16} />
        Clue Notebook
      </h2>

      {/* Crime scene setting */}
      <div className="mb-5 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
        <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">
          Crime Scene
        </p>
        <p className="text-sm text-zinc-300">{c.setting}</p>
      </div>

      {/* Opening narration */}
      <div className="mb-5 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
        <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">
          Case Brief
        </p>
        <p className="text-sm text-zinc-300 italic leading-relaxed">
          &quot;{c.narrative}&quot;
        </p>
      </div>

      {/* Clues */}
      <div className="space-y-3">
        {c.clues.map((clue, i) => (
          <div
            key={clue.id}
            className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800 hover:border-amber-900/40 transition-colors"
          >
            <div className="flex items-center gap-2 mb-1">
              <Fingerprint size={14} className="text-amber-500 shrink-0" />
              <span className="text-sm font-semibold text-amber-200">
                Clue #{i + 1}: {clue.name}
              </span>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">
              {clue.description}
            </p>
            <div className="flex items-center gap-1 mt-2 text-xs text-zinc-500">
              <MapPin size={10} />
              Found at: {clue.location}
            </div>
          </div>
        ))}
      </div>

      {/* Victim details */}
      <div className="mt-5 p-3 rounded-lg bg-red-950/20 border border-red-900/30">
        <p className="text-xs text-red-400 uppercase tracking-wide mb-1">
          Victim
        </p>
        <p className="text-sm text-zinc-300 font-semibold">{c.victim.name}</p>
        <p className="text-xs text-zinc-400">
          Age {c.victim.age} — {c.victim.occupation}
        </p>
        <p className="text-xs text-red-400/80 mt-1">
          Cause of Death: {c.victim.causeOfDeath}
        </p>
      </div>
    </aside>
  );
}
