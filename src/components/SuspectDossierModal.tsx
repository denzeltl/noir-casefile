"use client";

import { motion } from "motion/react";
import { useGame } from "@/context/GameContext";
import { User, MessageCircle, ShieldAlert, ShieldCheck, X, FileSearch } from "lucide-react";
import type { Suspect } from "@/types/case";

interface SuspectDossierModalProps {
  suspect: Suspect | null;
  onClose: () => void;
}

export default function SuspectDossierModal({
  suspect,
  onClose,
}: SuspectDossierModalProps) {
  const { state, dispatch } = useGame();

  if (!suspect) return null;

  const chatHistory = state.chatHistories[suspect.id] || [];
  const questionsAsked = chatHistory.filter((m) => m.role === "user").length;

  const handleSelectAndQuestion = () => {
    dispatch({ type: "SELECT_SUSPECT", payload: suspect.id });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="bg-paper border border-rule-strong rounded-lg max-w-lg w-full p-5 sm:p-6 shadow-2xl relative my-auto max-h-[90vh] flex flex-col"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 btn text-muted hover:text-ink p-1 rounded-lg hover:bg-rule cursor-pointer"
        >
          <X className="spin w-5 h-5" />
        </button>

        {/* Dossier Header */}
        <div className="flex items-center gap-3.5 mb-4 pb-4 border-b border-rule-strong">
          <div className="w-14 h-14 rounded-md bg-sheet border border-rule-strong flex items-center justify-center shrink-0">
            <User className="w-7 h-7 text-ink" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-widest text-ink font-bold">
                Person of Interest File
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-sheet text-muted border border-rule-strong">
                {questionsAsked} Qs Asked
              </span>
            </div>
            <h3 className="text-xl font-bold text-ink truncate">
              {suspect.name}
            </h3>
            <p className="text-xs text-muted">
              {suspect.age} years old · {suspect.occupation}
            </p>
          </div>
        </div>

        {/* Body Info */}
        <div className="space-y-3.5 overflow-y-auto flex-1 pr-1 text-xs sm:text-sm">
          {/* Appearance & Relationship */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="bg-sheet border border-rule-strong rounded-md p-3">
              <div className="text-xs font-mono text-muted uppercase mb-1">
                Appearance
              </div>
              <div className="text-ink">{suspect.appearance}</div>
            </div>
            <div className="bg-sheet border border-rule-strong rounded-md p-3">
              <div className="text-xs font-mono text-muted uppercase mb-1">
                Relationship to Victim
              </div>
              <div className="text-ink">{suspect.relationshipToVictim}</div>
            </div>
          </div>

          {/* Stated Alibi */}
          <div className="bg-sheet border border-rule-strong rounded-md p-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-mono uppercase tracking-wider text-ink font-bold">
                Official Stated Alibi
              </span>
              <span className="text-xs font-mono text-muted">Recorded on record</span>
            </div>
            <p className="text-ink italic font-serif leading-relaxed">
              &quot;{suspect.alibi}&quot;
            </p>
          </div>

          {/* Questioning Log */}
          <div className="bg-sheet border border-rule-strong rounded-md p-3.5">
            <div className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-muted font-bold mb-2">
              <MessageCircle className="w-3.5 h-3.5 text-ink" />
              Interrogation Transcript ({chatHistory.length} Exchanges)
            </div>

            {chatHistory.length === 0 ? (
              <p className="text-xs text-muted italic">
                No questions have been asked to this suspect yet.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto text-xs">
                {chatHistory.map((msg, i) => (
                  <div
                    key={i}
                    className={`p-2.5 rounded-lg ${
                      msg.role === "user"
                        ? "bg-hl-peach/40 border border-rule-strong text-ink"
                        : "bg-paper border border-rule-strong text-muted"
                    }`}
                  >
                    <span className="font-mono text-xs text-muted block mb-0.5">
                      {msg.role === "user" ? "Detective" : suspect.name}:
                    </span>
                    <p className="leading-relaxed">{msg.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-rule-strong mt-3 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="btn text-xs font-mono text-muted hover:text-ink px-3 py-2 cursor-pointer"
          >
            Close File
          </button>

          <button
            onClick={handleSelectAndQuestion}
            className="btn btn-ink font-mono text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-md transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            Interrogate {suspect.name.split(" ")[0]}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
