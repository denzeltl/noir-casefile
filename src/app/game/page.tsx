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
import { MarksProvider } from "@/context/MarksContext";
import { motion } from "motion/react";
import SuspectDossierModal from "@/components/SuspectDossierModal";
import type { Clue, Suspect } from "@/types/case";

type MobileTab = "suspects" | "interrogation" | "clues";

export default function GamePage() {
  const { state } = useGame();
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
      <div className="flex min-h-[100dvh] items-center justify-center bg-desk px-4">
        <div className="sheet w-full max-w-sm bg-paper p-8" role="status">
          <p className="label">{!state.isHydrated ? "Pulling the file" : "Writing the file"}</p>
          <h2 className="mt-2 text-[24px] leading-tight">
            {!state.isHydrated ? "Finding your case in the archive…" : "Typing up a fresh murder…"}
          </h2>
          <p className="mt-2 text-muted">
            {!state.isHydrated
              ? "Restoring your questions and transcripts."
              : "Victim, scene, clues and every suspect's alibi. This takes a few seconds."}
          </p>
          <span className="mt-5 block h-0.5 w-full overflow-hidden bg-rule" aria-hidden="true">
            <span className="block h-full w-1/3 animate-pulse bg-ink" />
          </span>
        </div>
      </div>
    );
  }

  if (!state.activeCase) return null;

  const handleSelectSuspectMobile = () => setMobileTab("interrogation");

  const TABS: { id: MobileTab; label: string }[] = [
    { id: "suspects", label: `Suspects (${state.activeCase.suspects.length})` },
    { id: "interrogation", label: "Interview" },
    { id: "clues", label: `Evidence (${state.activeCase.clues.length})` },
  ];

  return (
    <MarksProvider key={state.activeCase.id} caseId={state.activeCase.id}>
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-desk text-ink">
      <CaseHeader />

      {state.error && (
        <p role="alert" className="shrink-0 border-b border-pen/60 bg-hl-red/25 px-4 py-2.5 text-[15px] sm:px-6">
          <span className="label !text-pen mr-2">Something went wrong</span>
          {state.error}. Try again in a moment.
        </p>
      )}

      {/* Index tabs below lg: the active tab is the sheet in front. */}
      <div className="isolate flex shrink-0 gap-1 border-b border-rule-strong px-3 pt-2 lg:hidden" role="tablist" aria-label="Workspace">
        {TABS.map((t) => {
          const active = mobileTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setMobileTab(t.id)}
              className={`relative -mb-px min-h-11 flex-1 cursor-pointer truncate px-2 font-mono text-[12px] uppercase transition-colors duration-150 ${
                active ? "text-ink" : "text-muted hover:text-ink"
              }`}
            >
              {/* The sheet in front slides to the chosen tab. */}
              {active && (
                <motion.span
                  layoutId="tab-sheet"
                  className="absolute inset-0 -z-10 rounded-t-md border border-rule-strong border-b-paper bg-paper"
                  transition={{ type: "spring", stiffness: 420, damping: 36 }}
                />
              )}
              <span className="relative">{t.label}</span>
            </button>
          );
        })}
      </div>

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {/* Lineup */}
        <div
          className={`w-full shrink-0 overflow-y-auto border-r border-rule-strong bg-desk p-3 sm:p-4 lg:w-72 xl:w-80 ${
            mobileTab === "suspects" ? "pane-in block" : "hidden lg:block"
          }`}
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-2 border-b border-rule-strong pb-2">
            <h2 className="label !text-ink">Lineup</h2>
            <span className="label">{state.activeCase.suspects.length} people · one did it</span>
          </div>
          <ul className="mt-3 space-y-2.5 pr-1.5">
            {state.activeCase.suspects.map((suspect) => (
              <li key={suspect.id}>
                <SuspectCard
                  suspect={suspect}
                  onSelect={handleSelectSuspectMobile}
                  onOpenDossier={(s) => setInspectedSuspect(s)}
                />
              </li>
            ))}
          </ul>
        </div>

        {/* Interview */}
        <div
          className={`min-h-0 min-w-0 flex-1 flex-col bg-paper ${
            mobileTab === "interrogation" ? "pane-in flex" : "hidden lg:flex"
          }`}
        >
          <InterrogationRoom onOpenDossier={(s) => setInspectedSuspect(s)} />
        </div>

        {/* Evidence */}
        <div
          className={`w-full shrink-0 overflow-y-auto border-l border-rule-strong bg-desk lg:w-80 xl:w-96 ${
            mobileTab === "clues" ? "pane-in block" : "hidden lg:block"
          }`}
        >
          <ClueNotebook onInspectClue={(clue, index) => setInspectedClue({ clue, index })} />
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
    </MarksProvider>
  );
}
