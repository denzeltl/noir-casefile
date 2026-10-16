"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/context/GameContext";
import CaseHeader from "@/components/CaseHeader";
import SuspectCard from "@/components/SuspectCard";
import InterrogationRoom from "@/components/InterrogationRoom";
import ClueNotebook from "@/components/ClueNotebook";
import AccusationModal from "@/components/AccusationModal";
import CaseBriefingModal from "@/components/CaseBriefingModal";
import ClueDetailModal from "@/components/ClueDetailModal";
import SuspectDossierModal from "@/components/SuspectDossierModal";
import {
  Loader2,
  AlertTriangle,
  Users,
  MessageCircle,
  Search,
} from "lucide-react";
import type { Clue, Suspect } from "@/types/case";

type MobileTab = "suspects" | "interrogation" | "clues";

export default function GamePage() {
  const { state, dispatch } = useGame();
  const router = useRouter();

  // Mobile navigation tabs
  const [mobileTab, setMobileTab] = useState<MobileTab>("interrogation");

  // Modal inspection states
  const [inspectedClue, setInspectedClue] = useState<{
    clue: Clue;
    index: number;
  } | null>(null);
  const [inspectedSuspect, setInspectedSuspect] = useState<Suspect | null>(null);

  // Redirect to landing if no active case (only after hydration)
  useEffect(() => {
    if (!state.isHydrated) return;
    if (!state.activeCase && !state.isLoading) {
      router.replace("/");
    }
  }, [state.isHydrated, state.activeCase, state.isLoading, router]);

  // Loading state when waiting for hydration or new case
  if (!state.isHydrated || (state.isLoading && !state.activeCase)) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center dossier-grid px-4">
        <div className="text-center bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-sm w-full shadow-2xl">
          <Loader2 className="w-10 h-10 mx-auto animate-spin text-amber-500 mb-4" />
          <h2 className="text-lg font-bold text-zinc-100 font-mono uppercase tracking-wide">
            {!state.isHydrated ? "Retrieving Casefile..." : "Drafting Murder Dossier..."}
          </h2>
          <p className="text-xs text-zinc-300 mt-2 font-mono">
            {!state.isHydrated
              ? "Reopening sealed police archives and evidence locker."
              : "Generating crime scene, verifying alibis, and planting clues."}
          </p>
        </div>
      </div>
    );
  }

  if (!state.activeCase) return null;

  const handleSelectSuspectMobile = (suspectId: string) => {
    dispatch({ type: "SELECT_SUSPECT", payload: suspectId });
    setMobileTab("interrogation");
  };

  return (
    <div className="h-screen bg-zinc-950 text-zinc-100 flex flex-col dossier-grid selection:bg-amber-600/35 selection:text-amber-100 overflow-hidden">
      {/* Top Header */}
      <CaseHeader />

      {/* Error Banner */}
      {state.error && (
        <div className="bg-red-950/70 border-b border-red-800 px-4 sm:px-6 py-2.5 flex items-center gap-2 text-xs sm:text-sm text-red-200">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      {/* Mobile / Tablet Tab Bar (< lg screens) */}
      <div className="lg:hidden bg-zinc-900/90 border-b border-zinc-800 px-3 py-2 flex items-center justify-around text-xs font-mono shrink-0">
        <button
          onClick={() => setMobileTab("suspects")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            mobileTab === "suspects"
              ? "bg-amber-600/30 text-amber-200 border border-amber-600/50 font-bold"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Suspects ({state.activeCase.suspects.length})</span>
        </button>

        <button
          onClick={() => setMobileTab("interrogation")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            mobileTab === "interrogation"
              ? "bg-amber-600/30 text-amber-200 border border-amber-600/50 font-bold"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>Interrogation</span>
        </button>

        <button
          onClick={() => setMobileTab("clues")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            mobileTab === "clues"
              ? "bg-amber-600/30 text-amber-200 border border-amber-600/50 font-bold"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Clues ({state.activeCase.clues.length})</span>
        </button>
      </div>

      {/* Main Investigation Workspace */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        {/* Left Column: Suspects Lineup (Always visible on desktop, tab on mobile) */}
        <div
          className={`w-full lg:w-72 xl:w-80 shrink-0 border-r border-zinc-800 bg-zinc-950/60 p-3 sm:p-4 space-y-3 overflow-y-auto ${
            mobileTab === "suspects" ? "block" : "hidden lg:block"
          }`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <h2 className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Suspect Lineup
            </h2>
            <span className="text-xs font-mono text-zinc-300">
              {state.activeCase.suspects.length} Persons
            </span>
          </div>

          <div className="space-y-2.5">
            {state.activeCase.suspects.map((suspect) => (
              <div
                key={suspect.id}
                onClick={() => handleSelectSuspectMobile(suspect.id)}
              >
                <SuspectCard
                  suspect={suspect}
                  onOpenDossier={(s) => setInspectedSuspect(s)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Center Column: Interrogation Room (Always visible on desktop, tab on mobile) */}
        <div
          className={`flex-1 flex flex-col min-h-0 ${
            mobileTab === "interrogation" ? "flex" : "hidden lg:flex"
          }`}
        >
          <InterrogationRoom
            onOpenDossier={(s) => setInspectedSuspect(s)}
          />
        </div>

        {/* Right Column: Clue Notebook & Evidence Locker (Always visible on desktop, tab on mobile) */}
        <div
          className={`w-full lg:w-80 xl:w-96 shrink-0 overflow-y-auto ${
            mobileTab === "clues" ? "block" : "hidden lg:block"
          }`}
        >
          <ClueNotebook
            onInspectClue={(clue, index) =>
              setInspectedClue({ clue, index })
            }
          />
        </div>
      </div>

      {/* ─── Modals & Overlays ─── */}
      {/* 1. Case Introduction Briefing Walkthrough Modal */}
      <CaseBriefingModal />

      {/* 2. Interactive Clue Forensics Detail Modal */}
      <ClueDetailModal
        clue={inspectedClue?.clue || null}
        clueIndex={inspectedClue?.index || 0}
        onClose={() => setInspectedClue(null)}
      />

      {/* 3. Suspect Police File Dossier Modal */}
      <SuspectDossierModal
        suspect={inspectedSuspect}
        onClose={() => setInspectedSuspect(null)}
      />

      {/* 4. Accusation & Court Verdict Modal */}
      <AccusationModal />
    </div>
  );
}
