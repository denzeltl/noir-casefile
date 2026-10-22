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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="bg-paper border border-rule-strong rounded-lg max-w-lg w-full p-5 sm:p-6 shadow-2xl relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 btn text-muted hover:text-ink p-1 rounded-lg hover:bg-rule cursor-pointer"
        >
          <X className="spin w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-hl-peach/40 border border-rule-strong flex items-center justify-center">
            <Fingerprint className="w-4 h-4 text-ink" />
          </div>
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-ink font-bold">
              Evidence Log #{clueIndex + 1}
            </span>
            <div className="text-xs text-muted font-mono">Chain of Custody Verified</div>
          </div>
        </div>

        <h3 className="text-xl font-bold text-ink mb-2">{clue.name}</h3>

        <div className="flex items-center gap-1.5 text-xs font-mono text-muted bg-sheet border border-rule-strong px-3 py-1.5 rounded-lg mb-4 w-fit">
          <MapPin className="w-3.5 h-3.5 text-ink" />
          <span>Location: <strong className="text-ink">{clue.location}</strong></span>
        </div>

        <div className="bg-sheet border border-rule-strong rounded-md p-4 mb-4">
          <div className="text-xs font-mono uppercase text-muted mb-1.5">
            Forensic Description
          </div>
          <p className="text-sm text-ink leading-relaxed">
            {clue.description}
          </p>
        </div>

        <div className="bg-hl-peach/40 border border-rule-strong rounded-md p-3.5 text-xs text-ink flex items-start gap-2 mb-5">
          <AlertCircle className="w-4 h-4 text-ink shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Deduction Hint:</strong> Confront suspects who claim they were nowhere near {clue.location}, or ask who had access to this item.
          </p>
        </div>

        <button
          onClick={onClose}
          className="btn btn-quiet w-full text-ink font-mono text-xs uppercase font-bold py-2.5 rounded-md transition-colors cursor-pointer"
        >
          Return to Investigation
        </button>
      </motion.div>
    </div>
  );
}
