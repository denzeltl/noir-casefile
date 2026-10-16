"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Skull,
  Shield,
  HelpCircle,
  Eye,
  AlertOctagon,
  UserX,
  FileSearch,
  ArrowRight,
  Loader2,
  FolderOpen,
  RotateCcw,
} from "lucide-react";
import {
  DIFFICULTIES,
  DIFFICULTY_CONFIGS,
  type Difficulty,
} from "@/types/case";

interface DifficultySliderProps {
  difficulty: Difficulty;
  onChange: (diff: Difficulty) => void;
  onLaunch?: () => void;
  onResume?: () => void;
  hasActiveCase?: boolean;
  isLoading?: boolean;
}

const DIFFICULTY_THEMES: Record<
  Difficulty,
  {
    color: string;
    accentBg: string;
    badgeBorder: string;
    badgeText: string;
    buttonBg: string;
    glow: string;
    icon: React.ReactNode;
  }
> = {
  easy: {
    color: "text-emerald-400",
    accentBg: "bg-emerald-950/60",
    badgeBorder: "border-emerald-700/60",
    badgeText: "text-emerald-300",
    buttonBg: "bg-emerald-700 hover:bg-emerald-600 shadow-emerald-950/50",
    glow: "rgba(16, 185, 129, 0.12)",
    icon: <Shield className="w-5 h-5 text-emerald-400" />,
  },
  medium: {
    color: "text-amber-400",
    accentBg: "bg-amber-950/60",
    badgeBorder: "border-amber-700/60",
    badgeText: "text-amber-300",
    buttonBg: "bg-amber-700 hover:bg-amber-600 shadow-amber-950/50",
    glow: "rgba(245, 158, 11, 0.12)",
    icon: <Eye className="w-5 h-5 text-amber-400" />,
  },
  hard: {
    color: "text-orange-400",
    accentBg: "bg-orange-950/60",
    badgeBorder: "border-orange-700/60",
    badgeText: "text-orange-300",
    buttonBg: "bg-orange-700 hover:bg-orange-600 shadow-orange-950/50",
    glow: "rgba(249, 115, 22, 0.15)",
    icon: <AlertOctagon className="w-5 h-5 text-orange-400" />,
  },
  noir: {
    color: "text-purple-400",
    accentBg: "bg-purple-950/60",
    badgeBorder: "border-purple-700/60",
    badgeText: "text-purple-300",
    buttonBg: "bg-purple-800 hover:bg-purple-700 shadow-purple-950/50",
    glow: "rgba(168, 85, 247, 0.18)",
    icon: <Skull className="w-5 h-5 text-purple-400" />,
  },
};

export default function DifficultySlider({
  difficulty,
  onChange,
  onLaunch,
  onResume,
  hasActiveCase = false,
  isLoading = false,
}: DifficultySliderProps) {
  const reduceMotion = useReducedMotion();
  const currentIndex = DIFFICULTIES.indexOf(difficulty);
  const currentConfig = DIFFICULTY_CONFIGS[difficulty];
  const theme = DIFFICULTY_THEMES[difficulty];

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const idx = parseInt(e.target.value, 10);
    if (!isNaN(idx) && DIFFICULTIES[idx]) {
      onChange(DIFFICULTIES[idx]);
    }
  };

  return (
    <div className="w-full relative">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-6 md:p-8 relative overflow-hidden shadow-2xl">
        {/* Subtle ambient glow */}
        <div
          className="absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl pointer-events-none transition-colors duration-500"
          style={{ background: theme.glow }}
        />

        {/* Header inside slider */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-5 sm:mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-700 flex items-center justify-center shrink-0">
              {theme.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-widest font-mono text-zinc-300">
                  Case Difficulty
                </span>
                <span
                  className={`text-xs font-bold font-mono uppercase px-2 py-0.5 rounded border ${theme.badgeBorder} ${theme.badgeText} ${theme.accentBg}`}
                >
                  Level {currentIndex + 1} of 4
                </span>
              </div>
              <h3 className={`text-xl sm:text-2xl font-black tracking-tight ${theme.color}`}>
                {currentConfig.label}
              </h3>
            </div>
          </div>

          <div className="text-xs text-zinc-300 font-mono bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-lg self-start sm:self-auto">
            <span>Drag slider to adjust</span>
          </div>
        </div>

        {/* The Range Slider with exact aligned notches */}
        <div className="py-2 mb-4 sm:mb-5">
          <div className="relative mb-3 flex items-center">
            {/* Background track pips positioned at exact knob centers */}
            <div className="absolute inset-0 pointer-events-none z-0">
              {DIFFICULTIES.map((key, idx) => {
                const f = idx / (DIFFICULTIES.length - 1);
                return (
                  <div
                    key={key}
                    style={{
                      left: `calc(${f * 100}% + ${(0.5 - f) * 24}px)`,
                      transform: "translateX(-50%)",
                    }}
                    className={`absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full transition-colors ${
                      idx <= currentIndex ? "bg-amber-400/90 shadow-[0_0_6px_rgba(251,191,36,0.6)]" : "bg-zinc-700/80"
                    }`}
                  />
                );
              })}
            </div>

            <input
              type="range"
              min={0}
              max={DIFFICULTIES.length - 1}
              step={1}
              value={currentIndex}
              onChange={handleSliderChange}
              aria-label="Select mystery case difficulty"
              className="w-full h-3 bg-zinc-800 rounded-lg appearance-none cursor-pointer noir-slider relative z-10"
            />
          </div>

          {/* Notch labels positioned at exact knob center coordinates */}
          <div className="relative h-7 text-xs font-mono">
            {DIFFICULTIES.map((key, idx) => {
              const active = key === difficulty;
              const cfg = DIFFICULTY_CONFIGS[key];
              const f = idx / (DIFFICULTIES.length - 1);

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onChange(key)}
                  style={{
                    left: `calc(${f * 100}% + ${(0.5 - f) * 24}px)`,
                    transform: "translateX(-50%)",
                  }}
                  className={`absolute top-0 transition-all cursor-pointer py-1 text-center group ${
                    active ? "text-amber-200 font-bold scale-105" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <span className="text-xs block leading-tight whitespace-nowrap">
                    {cfg.label}
                  </span>
                  <span
                    className={`block mx-auto mt-1 w-1.5 h-1.5 rounded-full transition-all ${
                      active ? "bg-amber-400 opacity-100 shadow-[0_0_8px_rgba(251,191,36,0.8)]" : "opacity-0"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Spec Tiles - Responsive Mobile Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 my-4 sm:my-5">
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 sm:p-3.5">
            <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-mono mb-1">
              <UserX className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              Suspects
            </div>
            <div className="text-xl sm:text-2xl font-black text-zinc-100 font-mono">
              {currentConfig.suspectCount}{" "}
              <span className="text-xs font-normal text-zinc-300">People</span>
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 sm:p-3.5">
            <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-mono mb-1">
              <FileSearch className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              Clues
            </div>
            <div className="text-xl sm:text-2xl font-black text-zinc-100 font-mono">
              {currentConfig.clueCount}{" "}
              <span className="text-xs font-normal text-zinc-300">Items</span>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-zinc-950 border border-zinc-800 rounded-xl p-3 sm:p-3.5">
            <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-mono mb-1">
              <HelpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              Question Limit
            </div>
            <div className="text-xl sm:text-2xl font-black text-zinc-100 font-mono">
              {currentConfig.maxQuestions}{" "}
              <span className="text-xs font-normal text-zinc-300">Questions</span>
            </div>
          </div>
        </div>

        {/* Psychological Profile Card - High Contrast */}
        <motion.div
          key={difficulty}
          initial={reduceMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="border border-zinc-800 bg-zinc-950 rounded-xl p-3.5 sm:p-5 text-sm"
        >
          <div className="space-y-2">
            <p className="text-zinc-200 text-xs sm:text-sm leading-relaxed">
              <strong className="text-amber-200 font-semibold">Killer Demeanor:</strong>{" "}
              {currentConfig.killerBehavior}
            </p>
            <p className="text-zinc-200 text-xs leading-relaxed border-t border-zinc-800 pt-2 font-mono">
              <strong className="text-zinc-100">Case Complexity:</strong> {currentConfig.extraRules}
            </p>
          </div>
        </motion.div>

        {/* Integrated Launch / Resume Button */}
        {onLaunch && (
          <div className="mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <div className="text-xs font-mono text-zinc-300 text-center sm:text-left">
              Configured with <span className="text-zinc-200 font-bold">{currentConfig.suspectCount} suspects</span> and <span className="text-zinc-200 font-bold">{currentConfig.maxQuestions} questions</span>
            </div>

            {hasActiveCase && onResume ? (
              <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onResume}
                  className="w-full sm:w-auto bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-mono text-xs sm:text-sm font-bold uppercase tracking-wider px-6 sm:px-7 py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ring-1 ring-amber-400/40"
                >
                  <FolderOpen className="w-4 h-4 text-amber-200" />
                  Return to Current Case
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={onLaunch}
                  disabled={isLoading}
                  className="w-full sm:w-auto bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-300 hover:text-white font-mono text-xs font-bold uppercase tracking-wider px-4 py-3 rounded-xl transition-all border border-zinc-700 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Abandon active case and start a new one"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" />
                      Start New Case
                    </>
                  )}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onLaunch}
                disabled={isLoading}
                className={`w-full sm:w-auto ${theme.buttonBg} active:scale-95 text-white font-mono text-xs sm:text-sm font-bold uppercase tracking-wider px-6 sm:px-8 py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating Case...
                  </>
                ) : (
                  <>
                    <Skull className="w-4 h-4 text-amber-200" />
                    Start {currentConfig.label} Case
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
