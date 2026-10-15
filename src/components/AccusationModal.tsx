"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/context/GameContext";
import { X, Gavel, CheckCircle, XCircle, Loader2 } from "lucide-react";

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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
          {/* Result icon */}
          <div className="text-center mb-4">
            {v.correct ? (
              <CheckCircle size={64} className="mx-auto text-green-500" />
            ) : (
              <XCircle size={64} className="mx-auto text-red-500" />
            )}
            <h2
              className={`text-2xl font-bold mt-3 ${
                v.correct ? "text-green-400" : "text-red-400"
              }`}
            >
              {v.correct ? "CASE SOLVED" : "CASE DISMISSED"}
            </h2>
          </div>

          {/* Verdict details */}
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              {v.correctSuspect ? (
                <CheckCircle size={16} className="text-green-500" />
              ) : (
                <XCircle size={16} className="text-red-500" />
              )}
              <span className="text-zinc-300">
                Suspect: {v.correctSuspect ? "Correct" : `Wrong — it was ${v.actualKillerName}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {v.correctWeapon ? (
                <CheckCircle size={16} className="text-green-500" />
              ) : (
                <XCircle size={16} className="text-red-500" />
              )}
              <span className="text-zinc-300">
                Weapon: {v.correctWeapon ? "Correct" : `Wrong — it was "${v.actualWeapon}"`}
              </span>
            </div>
          </div>

          {/* Judge's verdict */}
          <div className="mt-4 p-4 rounded-lg bg-zinc-800/60 border border-zinc-700">
            <p className="text-xs text-amber-500 uppercase tracking-wider mb-2">
              Judge&apos;s Verdict
            </p>
            <p className="text-sm text-zinc-300 italic leading-relaxed">
              &quot;{v.verdict}&quot;
            </p>
          </div>

          {/* Solution reveal */}
          <div className="mt-3 p-4 rounded-lg bg-amber-950/20 border border-amber-900/30">
            <p className="text-xs text-amber-400 uppercase tracking-wider mb-2">
              The Truth
            </p>
            <p className="text-sm text-zinc-300 leading-relaxed">
              {v.solution}
            </p>
          </div>

          {/* New game button */}
          <button
            onClick={() => {
              dispatch({ type: "RESET" });
              router.push("/");
            }}
            className="w-full mt-5 bg-amber-700 hover:bg-amber-600 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            New Case
          </button>
        </div>
      </div>
    );
  }

  // ─── Accusation form ───────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSuspect || !weapon.trim() || !evidence.trim()) return;
    await submitAccusation(selectedSuspect, weapon, evidence);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        {/* Close button */}
        <button
          onClick={() => dispatch({ type: "SHOW_ACCUSATION", payload: false })}
          className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <Gavel size={28} className="text-red-500" />
          <div>
            <h2 className="text-xl font-bold text-amber-100">
              File Your Accusation
            </h2>
            <p className="text-xs text-zinc-400">
              Choose carefully, detective. This decision is final.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Suspect selection */}
          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-2">
              Who is the killer?
            </label>
            <div className="space-y-2">
              {state.activeCase?.suspects.map((s) => (
                <label
                  key={s.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedSuspect === s.id
                      ? "border-red-500 bg-red-950/20"
                      : "border-zinc-700 hover:border-zinc-600"
                  }`}
                >
                  <input
                    type="radio"
                    name="suspect"
                    value={s.id}
                    checked={selectedSuspect === s.id}
                    onChange={(e) => setSelectedSuspect(e.target.value)}
                    className="accent-red-500"
                  />
                  <span className="text-sm text-zinc-200">
                    {s.name} — {s.occupation}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Weapon */}
          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-2">
              Murder weapon
            </label>
            <input
              type="text"
              value={weapon}
              onChange={(e) => setWeapon(e.target.value)}
              placeholder="e.g. A marble bookend"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-600 transition-colors"
            />
          </div>

          {/* Evidence explanation */}
          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-2">
              Present your evidence
            </label>
            <textarea
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              placeholder="Explain the clues and contradictions that led you to this conclusion..."
              rows={4}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-600 transition-colors resize-none"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={
              !selectedSuspect ||
              !weapon.trim() ||
              !evidence.trim() ||
              state.isLoading
            }
            className="w-full bg-red-700 hover:bg-red-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {state.isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                The judge is deliberating...
              </>
            ) : (
              <>
                <Gavel size={18} />
                Submit Accusation
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
