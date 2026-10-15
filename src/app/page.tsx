"use client";

import { useState } from "react";
import { useGame } from "@/context/GameContext";
import { useRouter } from "next/navigation";
import {
  Skull,
  Search,
  MessageCircle,
  Gavel,
  Fingerprint,
  Loader2,
  AlertTriangle,
  Sparkles,
  ShieldAlert,
  Flame,
} from "lucide-react";
import {
  DIFFICULTIES,
  DIFFICULTY_CONFIGS,
  type Difficulty,
} from "@/types/case";

const difficultyTheme = {
  easy: {
    border: "border-emerald-700/50 hover:border-emerald-500",
    active: "border-emerald-500 bg-emerald-950/40 text-emerald-300 shadow-lg shadow-emerald-950/30",
    badge: "text-emerald-400 bg-emerald-950/60",
  },
  medium: {
    border: "border-amber-700/50 hover:border-amber-500",
    active: "border-amber-500 bg-amber-950/40 text-amber-300 shadow-lg shadow-amber-950/30",
    badge: "text-amber-400 bg-amber-950/60",
  },
  hard: {
    border: "border-orange-700/50 hover:border-orange-500",
    active: "border-orange-500 bg-orange-950/40 text-orange-300 shadow-lg shadow-orange-950/30",
    badge: "text-orange-400 bg-orange-950/60",
  },
  noir: {
    border: "border-purple-700/50 hover:border-purple-500",
    active: "border-purple-500 bg-purple-950/40 text-purple-300 shadow-lg shadow-purple-950/30",
    badge: "text-purple-400 bg-purple-950/60",
  },
};

export default function LandingPage() {
  const { state, dispatch, generateCase } = useGame();
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(
    state.difficulty || "medium"
  );
  const router = useRouter();

  const handleDifficultyChange = (diff: Difficulty) => {
    setSelectedDifficulty(diff);
    dispatch({ type: "SET_DIFFICULTY", payload: diff });
  };

  const handleNewCase = async () => {
    await generateCase(selectedDifficulty);
    router.push("/game");
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Hero section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-14 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-amber-900/10 rounded-full blur-3xl pointer-events-none" />

        {/* Title & Tagline */}
        <div className="relative text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Skull size={44} className="text-red-500" />
            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-amber-100">
              NOIR CASEFILE
            </h1>
          </div>
          <p className="text-zinc-400 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Procedural AI murder mysteries. Gritty interrogations.
            <br />
            <span className="text-amber-500/90 font-medium">
              Catch the killer before your leads run dry.
            </span>
          </p>
        </div>

        {/* Difficulty Selection */}
        <div className="relative max-w-4xl w-full mb-10">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
              <Flame size={15} />
              Choose Investigation Difficulty
            </div>
            <span className="text-xs text-zinc-500">
              Affects suspects, clues, questions, and killer cunning
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {DIFFICULTIES.map((diffKey) => {
              const cfg = DIFFICULTY_CONFIGS[diffKey];
              const isSelected = selectedDifficulty === diffKey;
              const theme = difficultyTheme[diffKey];

              return (
                <button
                  key={diffKey}
                  type="button"
                  onClick={() => handleDifficultyChange(diffKey)}
                  className={`text-left p-4 rounded-xl border transition-all duration-200 relative ${
                    isSelected
                      ? theme.active
                      : "border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 text-zinc-300 " + theme.border
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm tracking-wide text-zinc-100">
                      {cfg.label}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${theme.badge}`}>
                      {cfg.maxQuestions} Qs
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-snug mb-2.5">
                    {cfg.description}
                  </p>
                  <div className="text-[11px] text-zinc-500 border-t border-zinc-800/80 pt-2 flex items-center justify-between">
                    <span>{cfg.suspectCount} Suspects</span>
                    <span>{cfg.clueCount} Clues</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* How it works */}
        <div className="relative grid grid-cols-1 md:grid-cols-4 gap-4 max-w-4xl w-full mb-10">
          {[
            {
              icon: <Sparkles size={22} />,
              title: "1. Generate Case",
              desc: "AI builds a fresh crime scene, evidence trail, and suspect lineup.",
            },
            {
              icon: <Search size={22} />,
              title: "2. Inspect Clues",
              desc: "Piece together forensics, objects, and crime scene anomalies.",
            },
            {
              icon: <MessageCircle size={22} />,
              title: "3. Interrogate",
              desc: "Grill suspects one-on-one. Watch for evasions and fractured alibis.",
            },
            {
              icon: <Gavel size={22} />,
              title: "4. Indictment",
              desc: "Name suspect and murder weapon. A hardboiled judge evaluates your proof.",
            },
          ].map((step, i) => (
            <div
              key={i}
              className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center hover:border-amber-900/40 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-amber-900/30 flex items-center justify-center mx-auto mb-2.5 text-amber-400">
                {step.icon}
              </div>
              <h3 className="text-xs font-bold text-amber-200 mb-1">
                {step.title}
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Field Notes / Rules */}
        <div className="relative max-w-2xl w-full mb-10 bg-zinc-900/40 border border-zinc-800 rounded-xl p-5">
          <h2 className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-3">
            <Fingerprint size={16} />
            Detective Field Manual
          </h2>
          <ul className="space-y-2 text-xs text-zinc-300">
            <li className="flex items-start gap-2">
              <span className="text-amber-500">•</span>
              <span>
                <strong>One Killer:</strong> Exactly one suspect has a cracked alibi and motive.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500">•</span>
              <span>
                <strong>Shared Clock:</strong> Questions are limited across all suspects. Don&apos;t waste them on pleasantries.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500">•</span>
              <span>
                <strong>Tougher Personas:</strong> In Hard and Noir, innocent bystanders look suspicious and the killer stays cold.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500">•</span>
              <span>
                <strong>Early Indictment:</strong> Confident early? You can file an accusation at any time.
              </span>
            </li>
          </ul>
        </div>

        {/* Error banner */}
        {state.error && (
          <div className="mb-6 bg-red-950/40 border border-red-900/30 rounded-lg px-4 py-3 flex items-center gap-2 text-xs text-red-300 max-w-md">
            <AlertTriangle size={16} />
            {state.error}
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleNewCase}
          disabled={state.isLoading}
          className="relative bg-amber-700 hover:bg-amber-600 disabled:bg-zinc-800 text-white font-bold text-base px-8 py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-amber-900/30 disabled:shadow-none flex items-center gap-3 cursor-pointer"
        >
          {state.isLoading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Launching Investigation...
            </>
          ) : (
            <>
              <Skull size={20} />
              Start New Case ({DIFFICULTY_CONFIGS[selectedDifficulty].label})
            </>
          )}
        </button>

        <p className="text-[11px] text-zinc-600 mt-4">
          Powered by Groq Cloud &amp; Qwen 3.8 27B
        </p>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 py-3 text-center text-xs text-zinc-600">
        Noir Casefile — Procedural AI Detective Mystery
      </footer>
    </div>
  );
}
