"use client";

import { motion } from "motion/react";
import { Fingerprint, MapPin, X, AlertCircle } from "lucide-react";
import type { Clue } from "@/types/case";

interface ClueDetailModalProps {
  clue: Clue | null;
  clueIndex: number;
  onClose: () => void;
}

export default function ClueDetailModal({
  clue,
  clueIndex,
  onClose,
}: ClueDetailModalProps) {
  if (!clue) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 p-1 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-amber-950/80 border border-amber-800/80 flex items-center justify-center">
            <Fingerprint className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-amber-500 font-bold">
              Evidence Log #{clueIndex + 1}
            </span>
            <div className="text-xs text-zinc-400 font-mono">Chain of Custody Verified</div>
          </div>
        </div>

        <h3 className="text-xl font-bold text-zinc-100 mb-2">{clue.name}</h3>

        <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg mb-4 w-fit">
          <MapPin className="w-3.5 h-3.5 text-amber-500" />
          <span>Location: <strong className="text-zinc-200">{clue.location}</strong></span>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 mb-4">
          <div className="text-xs font-mono uppercase text-zinc-400 mb-1.5">
            Forensic Description
          </div>
          <p className="text-sm text-zinc-200 leading-relaxed">
            {clue.description}
          </p>
        </div>

        <div className="bg-amber-950/20 border border-amber-900/30 rounded-xl p-3.5 text-xs text-amber-200/90 flex items-start gap-2 mb-5">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Deduction Hint:</strong> Confront suspects who claim they were nowhere near {clue.location}, or ask who had access to this item.
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-mono text-xs uppercase font-bold py-2.5 rounded-xl transition-colors cursor-pointer"
        >
          Return to Investigation
        </button>
      </motion.div>
    </div>
  );
}
