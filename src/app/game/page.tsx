"use client";

import { useGame } from "@/context/GameContext";
import CaseHeader from "@/components/CaseHeader";
import SuspectCard from "@/components/SuspectCard";
import InterrogationRoom from "@/components/InterrogationRoom";
import ClueNotebook from "@/components/ClueNotebook";
import AccusationModal from "@/components/AccusationModal";
import { Loader2, AlertTriangle } from "lucide-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function GamePage() {
  const { state } = useGame();
  const router = useRouter();

  // Redirect to landing if no active case
  useEffect(() => {
    if (!state.activeCase && !state.isLoading) {
      router.replace("/");
    }
  }, [state.activeCase, state.isLoading, router]);

  // Loading state
  if (state.isLoading && !state.activeCase) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="mx-auto animate-spin text-amber-500 mb-4" />
          <p className="text-amber-200 text-lg font-semibold">
            Generating your case...
          </p>
          <p className="text-zinc-500 text-sm mt-1">
            The city sleeps, but crime never does.
          </p>
        </div>
      </div>
    );
  }

  if (!state.activeCase) return null;

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <CaseHeader />

      {/* Error banner */}
      {state.error && (
        <div className="bg-red-950/40 border-b border-red-900/30 px-6 py-2 flex items-center gap-2 text-sm text-red-300">
          <AlertTriangle size={16} />
          {state.error}
        </div>
      )}

      {/* Main layout: suspects | interrogation | clues */}
      <div className="flex-1 flex min-h-0">
        {/* Suspects sidebar */}
        <div className="w-72 shrink-0 border-r border-zinc-800 bg-zinc-950/60 p-4 space-y-3 overflow-y-auto">
          <h2 className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2">
            Suspects
          </h2>
          {state.activeCase.suspects.map((suspect) => (
            <SuspectCard key={suspect.id} suspect={suspect} />
          ))}
        </div>

        {/* Interrogation room */}
        <InterrogationRoom />

        {/* Clue notebook sidebar */}
        <div className="w-80 shrink-0 overflow-y-auto">
          <ClueNotebook />
        </div>
      </div>

      {/* Accusation modal */}
      <AccusationModal />
    </div>
  );
}
