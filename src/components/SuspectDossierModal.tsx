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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative my-auto max-h-[90vh] flex flex-col"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 p-1 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Dossier Header */}
        <div className="flex items-center gap-3.5 mb-4 pb-4 border-b border-zinc-800">
          <div className="w-14 h-14 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center shrink-0">
            <User className="w-7 h-7 text-amber-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-500 font-bold">
                Person of Interest File
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800">
                {questionsAsked} Qs Asked
              </span>
            </div>
            <h3 className="text-xl font-bold text-zinc-100 truncate">
              {suspect.name}
            </h3>
            <p className="text-xs text-zinc-400">
              {suspect.age} years old · {suspect.occupation}
            </p>
          </div>
        </div>

        {/* Body Info */}
        <div className="space-y-3.5 overflow-y-auto flex-1 pr-1 text-xs sm:text-sm">
          {/* Appearance & Relationship */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3">
              <div className="text-[11px] font-mono text-zinc-400 uppercase mb-1">
                Appearance
              </div>
              <div className="text-zinc-200">{suspect.appearance}</div>
            </div>
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3">
              <div className="text-[11px] font-mono text-zinc-400 uppercase mb-1">
                Relationship to Victim
              </div>
              <div className="text-zinc-200">{suspect.relationshipToVictim}</div>
            </div>
          </div>

          {/* Stated Alibi */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                Official Stated Alibi
              </span>
              <span className="text-[10px] font-mono text-zinc-400">Recorded on record</span>
            </div>
            <p className="text-zinc-200 italic font-serif leading-relaxed">
              &quot;{suspect.alibi}&quot;
            </p>
          </div>

          {/* Questioning Log */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-3.5">
            <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold mb-2">
              <MessageCircle className="w-3.5 h-3.5 text-amber-500" />
              Interrogation Transcript ({chatHistory.length} Exchanges)
            </div>

            {chatHistory.length === 0 ? (
              <p className="text-xs text-zinc-400 italic">
                No questions have been asked to this suspect yet.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto text-xs">
                {chatHistory.map((msg, i) => (
                  <div
                    key={i}
                    className={`p-2.5 rounded-lg ${
                      msg.role === "user"
                        ? "bg-amber-950/40 border border-amber-800/40 text-amber-100"
                        : "bg-zinc-950 border border-zinc-800 text-zinc-300"
                    }`}
                  >
                    <span className="font-mono text-[10px] text-zinc-400 block mb-0.5">
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
        <div className="pt-4 border-t border-zinc-800 mt-3 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="text-xs font-mono text-zinc-400 hover:text-zinc-200 px-3 py-2 cursor-pointer"
          >
            Close File
          </button>

          <button
            onClick={handleSelectAndQuestion}
            className="bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-mono text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            Interrogate {suspect.name.split(" ")[0]}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
