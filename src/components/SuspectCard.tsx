"use client";

import { useGame } from "@/context/GameContext";
import { User, ShieldAlert, ShieldCheck } from "lucide-react";
import type { Suspect } from "@/types/case";

interface SuspectCardProps {
  suspect: Suspect;
}

export default function SuspectCard({ suspect }: SuspectCardProps) {
  const { state, dispatch } = useGame();

  const isActive = state.activeSuspectId === suspect.id;
  const messageCount = (state.chatHistories[suspect.id] || []).filter(
    (m) => m.role === "user"
  ).length;

  return (
    <button
      onClick={() => dispatch({ type: "SELECT_SUSPECT", payload: suspect.id })}
      className={`w-full text-left rounded-lg border p-4 transition-all duration-200 ${
        isActive
          ? "border-amber-500 bg-amber-950/30 shadow-lg shadow-amber-900/20"
          : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-600 hover:bg-zinc-900"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar placeholder */}
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
            isActive ? "bg-amber-900/50" : "bg-zinc-800"
          }`}
        >
          <User
            size={24}
            className={isActive ? "text-amber-400" : "text-zinc-500"}
          />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-amber-100 truncate">
            {suspect.name}
          </h3>
          <p className="text-xs text-zinc-400">{suspect.occupation}</p>
          <p className="text-xs text-zinc-500 mt-1 line-clamp-1">
            {suspect.appearance}
          </p>
        </div>
      </div>

      {/* Relationship & interrogation status */}
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-zinc-500 truncate max-w-[60%]">
          {suspect.relationshipToVictim}
        </span>
        <span className="flex items-center gap-1">
          {messageCount > 0 ? (
            <>
              <ShieldAlert size={12} className="text-amber-500" />
              <span className="text-amber-500">{messageCount} Qs asked</span>
            </>
          ) : (
            <>
              <ShieldCheck size={12} className="text-zinc-600" />
              <span className="text-zinc-600">Not questioned</span>
            </>
          )}
        </span>
      </div>
    </button>
  );
}
