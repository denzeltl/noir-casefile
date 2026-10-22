"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useGame } from "@/context/GameContext";
import { X, Gavel, CheckCircle, XCircle, Loader2, Sparkles, AlertCircle } from "lucide-react";

export default function AccusationModal() {
  const { state, dispatch, submitAccusation } = useGame();
  const router = useRouter();
  const [selectedSuspect, setSelectedSuspect] = useState("");
  const [weapon, setWeapon] = useState("");
  const [evidence, setEvidence] = useState("");

  if (!state.showAccusation && !state.verdict) return null;

  // ─── Verdict screen ────────────────────────────────────────────────
  if (state.verdict) {
    const v = state.verdict;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 backdrop-blur-md p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="bg-paper border border-rule-strong rounded-lg max-w-lg w-full p-6 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto"
        >
          {/* Result Icon & Stamp */}
          <div className="text-center mb-5">
            {v.correct ? (
              <div className="w-16 h-16 rounded-full bg-hl-green/50 border border-success-ink/50 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-9 h-9 text-success-ink" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-hl-red/25 border border-pen/60 flex items-center justify-center mx-auto mb-3">
                <XCircle className="w-9 h-9 text-pen" />
              </div>
            )}

            <div
              className={`inline-block font-mono text-xs uppercase tracking-widest px-3 py-1 rounded-full border mb-2 ${
                v.correct
                  ? "bg-hl-green/50 text-success-ink border-success-ink/50"
                  : "bg-hl-red/25 text-pen border-pen/60"
              }`}
            >
              {v.correct ? "Homicide Conviction Upheld" : "Case Dismissed / Cold Case"}
            </div>

            <h2
              className={`text-2xl sm:text-3xl font-black tracking-tight ${
                v.correct ? "text-success-ink" : "text-pen"
              }`}
            >
              {v.correct ? "CASE SOLVED" : "CASE DISMISSED"}
            </h2>
          </div>

          {/* Breakdown checklist */}
          <div className="grid grid-cols-2 gap-2.5 mb-4 text-xs font-mono">
            <div
              className={`p-3 rounded-md border flex items-center gap-2 ${
                v.correctSuspect
                  ? "bg-hl-green/50 border-success-ink/50 text-success-ink"
                  : "bg-hl-red/25 border-pen/60 text-pen"
              }`}
            >
              {v.correctSuspect ? (
                <CheckCircle className="w-4 h-4 text-success-ink shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-pen shrink-0" />
              )}
              <div className="truncate">
                <div className="text-xs text-muted">Suspect</div>
                <div className="font-bold truncate">
                  {v.correctSuspect ? "Identified" : v.actualKillerName}
                </div>
              </div>
            </div>

            <div
              className={`p-3 rounded-md border flex items-center gap-2 ${
                v.correctWeapon
                  ? "bg-hl-green/50 border-success-ink/50 text-success-ink"
                  : "bg-hl-red/25 border-pen/60 text-pen"
              }`}
            >
              {v.correctWeapon ? (
                <CheckCircle className="w-4 h-4 text-success-ink shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-pen shrink-0" />
              )}
              <div className="truncate">
                <div className="text-xs text-muted">Murder Weapon</div>
                <div className="font-bold truncate">
                  {v.correctWeapon ? "Matched" : v.actualWeapon}
                </div>
              </div>
            </div>
          </div>

          {/* Judge's Verdict */}
          <div className="bg-sheet border border-rule-strong rounded-md p-4 mb-3">
            <div className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-ink font-bold mb-1.5">
              <Gavel className="w-3.5 h-3.5" />
              Court Deliberation &amp; Ruling
            </div>
            <p className="text-xs sm:text-sm text-ink italic font-serif leading-relaxed">
              &quot;{v.verdict}&quot;
            </p>
          </div>

          {/* The Truth Solution */}
          <div className="bg-hl-peach/40 border border-rule-strong rounded-md p-4 mb-5">
            <div className="text-xs font-mono uppercase tracking-wider text-ink font-bold mb-1.5">
              The Full Truth Revealed
            </div>
            <p className="text-xs sm:text-sm text-muted leading-relaxed font-sans">
              {v.solution}
            </p>
          </div>

          {/* New Case Button */}
          <button
            onClick={() => {
              dispatch({ type: "RESET" });
              router.push("/");
            }}
            className="w-full btn btn-ink font-mono text-xs sm:text-sm font-bold uppercase tracking-wider py-3.5 rounded-md transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-ink" />
            Start New Case Investigation
          </button>
        </motion.div>
      </div>
    );
  }

  // ─── Accusation form ───────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSuspect || !weapon.trim() || !evidence.trim()) return;
    await submitAccusation(selectedSuspect, weapon, evidence);
  };

  const handleWeaponSuggestion = (name: string) => {
    setWeapon(name);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="bg-paper border border-rule-strong rounded-lg max-w-lg w-full p-5 sm:p-6 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          onClick={() => dispatch({ type: "SHOW_ACCUSATION", payload: false })}
          className="absolute top-4 right-4 btn text-muted hover:text-ink p-1 rounded-lg hover:bg-rule cursor-pointer"
        >
          <X className="spin w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-md bg-hl-red/25 border border-pen/60 flex items-center justify-center shrink-0">
            <Gavel className="w-5 h-5 text-pen" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-ink tracking-tight">
              File Formal Indictment
            </h2>
            <p className="text-xs text-muted font-mono">
              Provide your evidence. The court&apos;s verdict is final.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Suspect Selection */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-muted mb-2">
              1. Name the Murderer
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {state.activeCase?.suspects.map((s) => {
                const isSelected = selectedSuspect === s.id;
                return (
                  <label
                    key={s.id}
                    className={`card-lift flex items-center justify-between p-3 rounded-md border cursor-pointer ${
                      isSelected
                        ? "border-pen/60 bg-hl-red/25 text-pen ring-1 ring-pen/40"
                        : "border-rule-strong bg-sheet hover:border-muted text-muted"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="radio"
                        name="suspect"
                        value={s.id}
                        checked={isSelected}
                        onChange={(e) => setSelectedSuspect(e.target.value)}
                        className="accent-[var(--pen)] w-4 h-4"
                      />
                      <div className="truncate">
                        <span className="font-bold text-xs sm:text-sm block truncate">
                          {s.name}
                        </span>
                        <span className="text-xs text-muted block truncate">
                          {s.occupation} · {s.relationshipToVictim}
                        </span>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Murder Weapon Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-muted">
                2. Specify the Murder Weapon
              </label>
            </div>
            <input
              type="text"
              value={weapon}
              onChange={(e) => setWeapon(e.target.value)}
              placeholder="e.g. Ornate bronze candlestick, cyanide vial, heavy statuette..."
              className="w-full bg-sheet border border-rule-strong rounded-md px-4 py-2.5 text-xs sm:text-sm text-ink placeholder:text-muted field"
            />
            {/* Clue suggestions */}
            {state.activeCase?.clues && (
              <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-mono text-muted">Quick suggestions:</span>
                {state.activeCase.clues.slice(0, 3).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleWeaponSuggestion(c.name)}
                    className="btn btn-quiet text-xs font-mono bg-sheet text-muted px-2 py-1 rounded cursor-pointer truncate max-w-[160px]"
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Evidence Presentation */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-muted mb-1.5">
              3. Present the Evidence &amp; Contradiction
            </label>
            <textarea
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              placeholder="Explain which clue refutes their alibi and establishes their guilt..."
              rows={3}
              className="w-full bg-sheet border border-rule-strong rounded-md px-4 py-2.5 text-xs sm:text-sm text-ink placeholder:text-muted field resize-none"
            />
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={
              !selectedSuspect ||
              !weapon.trim() ||
              !evidence.trim() ||
              state.isLoading
            }
            className="w-full btn btn-ink disabled:opacity-50 font-mono text-xs sm:text-sm font-bold uppercase tracking-wider py-3 rounded-md transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {state.isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                The Judge is Deliberating...
              </>
            ) : (
              <>
                <Gavel className="w-4 h-4" />
                Submit Indictment for Verdict
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
