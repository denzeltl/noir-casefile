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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto"
        >
          {/* Result Icon & Stamp */}
          <div className="text-center mb-5">
            {v.correct ? (
              <div className="w-16 h-16 rounded-full bg-emerald-950/80 border border-emerald-600/60 flex items-center justify-center mx-auto mb-3 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                <CheckCircle className="w-9 h-9 text-emerald-400" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-red-950/80 border border-red-600/60 flex items-center justify-center mx-auto mb-3 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
                <XCircle className="w-9 h-9 text-red-400" />
              </div>
            )}

            <div
              className={`inline-block font-mono text-xs uppercase tracking-widest px-3 py-1 rounded-full border mb-2 ${
                v.correct
                  ? "bg-emerald-950/60 text-emerald-300 border-emerald-700/60"
                  : "bg-red-950/60 text-red-300 border-red-700/60"
              }`}
            >
              {v.correct ? "Homicide Conviction Upheld" : "Case Dismissed / Cold Case"}
            </div>

            <h2
              className={`text-2xl sm:text-3xl font-black tracking-tight ${
                v.correct ? "text-emerald-300" : "text-red-400"
              }`}
            >
              {v.correct ? "CASE SOLVED" : "CASE DISMISSED"}
            </h2>
          </div>

          {/* Breakdown checklist */}
          <div className="grid grid-cols-2 gap-2.5 mb-4 text-xs font-mono">
            <div
              className={`p-3 rounded-xl border flex items-center gap-2 ${
                v.correctSuspect
                  ? "bg-emerald-950/30 border-emerald-800/60 text-emerald-200"
                  : "bg-red-950/30 border-red-800/60 text-red-200"
              }`}
            >
              {v.correctSuspect ? (
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <div className="truncate">
                <div className="text-[10px] text-zinc-400">Suspect</div>
                <div className="font-bold truncate">
                  {v.correctSuspect ? "Identified" : v.actualKillerName}
                </div>
              </div>
            </div>

            <div
              className={`p-3 rounded-xl border flex items-center gap-2 ${
                v.correctWeapon
                  ? "bg-emerald-950/30 border-emerald-800/60 text-emerald-200"
                  : "bg-red-950/30 border-red-800/60 text-red-200"
              }`}
            >
              {v.correctWeapon ? (
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <div className="truncate">
                <div className="text-[10px] text-zinc-400">Murder Weapon</div>
                <div className="font-bold truncate">
                  {v.correctWeapon ? "Matched" : v.actualWeapon}
                </div>
              </div>
            </div>
          </div>

          {/* Judge's Verdict */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-3">
            <div className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-amber-400 font-bold mb-1.5">
              <Gavel className="w-3.5 h-3.5" />
              Court Deliberation &amp; Ruling
            </div>
            <p className="text-xs sm:text-sm text-zinc-200 italic font-serif leading-relaxed">
              &quot;{v.verdict}&quot;
            </p>
          </div>

          {/* The Truth Solution */}
          <div className="bg-amber-950/20 border border-amber-900/40 rounded-xl p-4 mb-5">
            <div className="text-xs font-mono uppercase tracking-wider text-amber-300 font-bold mb-1.5">
              The Full Truth Revealed
            </div>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
              {v.solution}
            </p>
          </div>

          {/* New Case Button */}
          <button
            onClick={() => {
              dispatch({ type: "RESET" });
              router.push("/");
            }}
            className="w-full bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-mono text-xs sm:text-sm font-bold uppercase tracking-wider py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-200" />
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          onClick={() => dispatch({ type: "SHOW_ACCUSATION", payload: false })}
          className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 p-1 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-red-950 border border-red-800/80 flex items-center justify-center shrink-0">
            <Gavel className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-zinc-100 tracking-tight">
              File Formal Indictment
            </h2>
            <p className="text-xs text-zinc-400 font-mono">
              Provide your evidence. The court&apos;s verdict is final.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Suspect Selection */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 mb-2">
              1. Name the Murderer
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {state.activeCase?.suspects.map((s) => {
                const isSelected = selectedSuspect === s.id;
                return (
                  <label
                    key={s.id}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "border-red-600 bg-red-950/30 text-red-100 ring-1 ring-red-600/50"
                        : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 text-zinc-300"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="radio"
                        name="suspect"
                        value={s.id}
                        checked={isSelected}
                        onChange={(e) => setSelectedSuspect(e.target.value)}
                        className="accent-red-500 w-4 h-4"
                      />
                      <div className="truncate">
                        <span className="font-bold text-xs sm:text-sm block truncate">
                          {s.name}
                        </span>
                        <span className="text-[11px] text-zinc-400 block truncate">
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
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
                2. Specify the Murder Weapon
              </label>
            </div>
            <input
              type="text"
              value={weapon}
              onChange={(e) => setWeapon(e.target.value)}
              placeholder="e.g. Ornate bronze candlestick, cyanide vial, heavy statuette..."
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
            {/* Clue suggestions */}
            {state.activeCase?.clues && (
              <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-mono text-zinc-500">Quick suggestions:</span>
                {state.activeCase.clues.slice(0, 3).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleWeaponSuggestion(c.name)}
                    className="text-[10px] font-mono bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60 px-2 py-0.5 rounded cursor-pointer transition-colors truncate max-w-[140px]"
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Evidence Presentation */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
              3. Present the Evidence &amp; Contradiction
            </label>
            <textarea
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              placeholder="Explain which clue refutes their alibi and establishes their guilt..."
              rows={3}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 transition-colors resize-none"
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
            className="w-full bg-red-700 hover:bg-red-600 disabled:bg-zinc-800 disabled:text-zinc-500 active:scale-95 text-white font-mono text-xs sm:text-sm font-bold uppercase tracking-wider py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
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
