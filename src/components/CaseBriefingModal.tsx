"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useGame } from "@/context/GameContext";
import {
  Skull,
  Search,
  Users,
  MapPin,
  Fingerprint,
  ArrowRight,
  ArrowLeft,
  X,
  FileText,
  AlertCircle,
  ShieldAlert,
} from "lucide-react";
import { DIFFICULTY_CONFIGS } from "@/types/case";

const STEPS = [
  { id: 1, title: "Crime Scene & Incident", icon: Skull },
  { id: 2, title: "Forensic Evidence", icon: Fingerprint },
  { id: 3, title: "Suspect Lineup", icon: Users },
];

export default function CaseBriefingModal() {
  const { state, dispatch } = useGame();
  const [currentStep, setCurrentStep] = useState(1);
  const [slideDirection, setSlideDirection] = useState<"forward" | "back">("forward");

  const c = state.activeCase;
  if (!state.showBriefing || !c) return null;

  const diffConfig = DIFFICULTY_CONFIGS[state.difficulty] || DIFFICULTY_CONFIGS.medium;

  const handleNext = () => {
    if (currentStep < 3) {
      setSlideDirection("forward");
      setCurrentStep((prev) => prev + 1);
    } else {
      dispatch({ type: "SHOW_BRIEFING", payload: false });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setSlideDirection("back");
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleClose = () => {
    dispatch({ type: "SHOW_BRIEFING", payload: false });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="bg-paper border border-rule-strong rounded-lg max-w-2xl w-full shadow-sheet overflow-hidden relative flex flex-col my-auto max-h-[92vh]"
      >
        {/* Top Header / Police Dossier Banner */}
        <div className="bg-sheet border-b border-rule-strong px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-hl-red/25 border border-pen/60 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-pen" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-widest text-ink font-bold">
                  Confidential Homicide Dossier
                </span>
                <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-hl-peach/40 text-ink border border-rule-strong uppercase">
                  {diffConfig.label}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-ink truncate max-w-md">
                {c.title}
              </h2>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="btn text-muted hover:text-ink p-1.5 rounded-lg hover:bg-rule cursor-pointer"
            title="Skip Briefing"
          >
            <X className="spin w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator Bar */}
        <div className="bg-sheet border-b border-rule-strong px-4 sm:px-6 py-2.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {STEPS.map((step) => {
              const active = step.id === currentStep;
              const completed = step.id < currentStep;
              return (
                <button
                  key={step.id}
                  onClick={() => {
                    setSlideDirection(step.id > currentStep ? "forward" : "back");
                    setCurrentStep(step.id);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition-colors cursor-pointer ${
                    active
                      ? "bg-hl-peach text-ink border border-rule-strong font-bold"
                      : completed
                      ? "bg-rule text-muted hover:text-ink"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-paper text-xs flex items-center justify-center font-bold">
                    {step.id}
                  </span>
                  <span className="hidden sm:inline">{step.title}</span>
                </button>
              );
            })}
          </div>

          <div className="text-xs font-mono text-muted">
            Step {currentStep} of 3
          </div>
        </div>

        {/* Dynamic Step Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: slideDirection === "forward" ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: slideDirection === "forward" ? -20 : 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Victim Report Banner */}
                <div className="bg-hl-red/25 border border-pen/60 rounded-md p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Skull className="w-4 h-4 text-pen" />
                    <span className="text-xs font-mono uppercase tracking-wider text-pen font-bold">
                      Victim File
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-muted font-mono">Full Name</div>
                      <div className="text-base font-bold text-ink">{c.victim.name}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted font-mono">Age & Occupation</div>
                      <div className="text-ink">
                        {c.victim.age} years old · {c.victim.occupation}
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <div className="text-xs text-pen font-mono">Cause of Death</div>
                      <div className="text-pen font-semibold">{c.victim.causeOfDeath}</div>
                    </div>
                  </div>
                </div>

                {/* Crime Scene Location */}
                <div className="bg-sheet border border-rule-strong rounded-md p-4">
                  <div className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-ink mb-1.5 font-bold">
                    <MapPin className="w-4 h-4 text-ink" />
                    Crime Scene Location
                  </div>
                  <p className="text-sm text-ink">{c.setting}</p>
                </div>

                {/* Case Narrative */}
                <div className="bg-sheet border border-rule-strong rounded-md p-4">
                  <div className="text-xs font-mono uppercase tracking-wider text-muted mb-2 font-bold">
                    Detective Dispatch Notes
                  </div>
                  <p className="text-sm text-muted italic leading-relaxed font-serif">
                    &quot;{c.narrative}&quot;
                  </p>
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: slideDirection === "forward" ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: slideDirection === "forward" ? -20 : 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-3.5"
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs font-mono uppercase tracking-wider text-ink font-bold flex items-center gap-1.5">
                    <Search className="w-4 h-4" />
                    Physical Evidence Log ({c.clues.length} Items)
                  </div>
                  <span className="text-xs font-mono text-muted">
                    Cross-reference with alibis
                  </span>
                </div>

                <div className="space-y-3">
                  {c.clues.map((clue, idx) => (
                    <div
                      key={clue.id}
                      className="bg-sheet border border-rule-strong rounded-md p-3.5 sm:p-4 hover:border-muted transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-ink">
                            #{idx + 1}
                          </span>
                          <h4 className="font-bold text-sm text-ink">
                            {clue.name}
                          </h4>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-mono text-muted">
                          <MapPin className="w-3 h-3 text-ink" />
                          <span>{clue.location}</span>
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-muted leading-relaxed pl-5">
                        {clue.description}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="bg-hl-peach/40 border border-rule-strong rounded-md p-3 text-xs text-ink flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-ink shrink-0 mt-0.5" />
                  <span>
                    <strong>Detective Directive:</strong> One of these items directly contradicts the killer&apos;s story. Note who had physical access to these locations.
                  </span>
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: slideDirection === "forward" ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: slideDirection === "forward" ? -20 : 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-3.5"
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs font-mono uppercase tracking-wider text-ink font-bold flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    Suspect Lineup ({c.suspects.length} Persons of Interest)
                  </div>
                  <span className="text-xs font-mono text-pen font-bold">
                    Exactly 1 is the Killer
                  </span>
                </div>

                <div className="space-y-2.5 max-h-[46vh] overflow-y-auto pr-1">
                  {c.suspects.map((suspect) => (
                    <div
                      key={suspect.id}
                      className="bg-sheet border border-rule-strong rounded-md p-3 sm:p-3.5"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-bold text-sm text-ink">
                          {suspect.name}
                          <span className="text-xs font-normal text-muted ml-2">
                            ({suspect.age}y · {suspect.occupation})
                          </span>
                        </div>
                        <span className="text-xs font-mono text-muted">
                          {suspect.relationshipToVictim}
                        </span>
                      </div>
                      <div className="text-xs text-muted italic bg-paper border border-rule-strong rounded-lg p-2 mt-1.5 font-serif">
                        &quot;{suspect.alibi}&quot;
                      </div>
                    </div>
                  ))}
                </div>

                {/* Question Budget Reminder */}
                <div className="bg-sheet border border-rule-strong rounded-md p-3 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-ink" />
                    <span className="text-muted">
                      Total Question Budget: <strong className="text-ink">{diffConfig.maxQuestions} Questions</strong>
                    </span>
                  </div>
                  <span className="text-muted">Shared across all suspects</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Actions / Stepper Navigation */}
        <div className="bg-sheet border-t border-rule-strong px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 shrink-0">
          <div>
            {currentStep > 1 ? (
              <button
                onClick={handleBack}
                className="btn flex items-center gap-1.5 text-xs font-mono uppercase text-muted hover:text-ink px-3 py-2 rounded-lg hover:bg-rule cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            ) : (
              <button
                onClick={handleClose}
                className="btn text-xs font-mono text-muted hover:text-ink px-2 py-1 cursor-pointer"
              >
                Skip Briefing
              </button>
            )}
          </div>

          <button
            onClick={handleNext}
            className="btn btn-ink font-mono text-xs sm:text-sm font-bold uppercase tracking-wider px-5 py-2.5 rounded-md transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            {currentStep === 1 ? (
              <>
                <span>Review Clues</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : currentStep === 2 ? (
              <>
                <span>Review Suspects</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <Skull className="w-4 h-4 text-ink" />
                <span>Begin Interrogation</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
