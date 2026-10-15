"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useGame } from "@/context/GameContext";
import { Send, Lock, User, ShieldQuestion, FileText, Sparkles, AlertCircle } from "lucide-react";
import type { Suspect } from "@/types/case";

interface InterrogationRoomProps {
  onOpenDossier?: (suspect: Suspect) => void;
}

const QUICK_PROMPTS = [
  "Where were you around the time of the murder?",
  "Can anyone corroborate your alibi?",
  "What was your true relationship with the victim?",
  "Did you have any disagreements with the victim?",
];

export default function InterrogationRoom({ onOpenDossier }: InterrogationRoomProps) {
  const { state, dispatch, interrogate } = useGame();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suspect = state.activeCase?.suspects.find(
    (s) => s.id === state.activeSuspectId
  );
  const chatHistory = suspect
    ? state.chatHistories[suspect.id] || []
    : [];
  const canAsk = state.questionsRemaining > 0 && !state.isLoading;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory.length, state.isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !suspect || !canAsk) return;
    const question = input.trim();
    setInput("");
    await interrogate(suspect.id, question);
  };

  const handleQuickPrompt = async (prompt: string) => {
    if (!suspect || !canAsk) return;
    await interrogate(suspect.id, prompt);
  };

  // No suspect selected state
  if (!suspect) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-500 p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4">
            <ShieldQuestion className="w-8 h-8 text-zinc-600" />
          </div>
          <h3 className="text-lg font-bold text-zinc-200 mb-1">Interrogation Room Empty</h3>
          <p className="text-xs sm:text-sm text-zinc-400">
            Select a suspect from the lineup to bring them in for questioning.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-zinc-950/40 relative">
      {/* Suspect Header in Interrogation Room */}
      <div className="px-4 sm:px-6 py-3 border-b border-zinc-800 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-700/60 flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-amber-300" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm sm:text-base text-zinc-100 truncate">
                {suspect.name}
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-950 text-zinc-400 border border-zinc-800 hidden sm:inline">
                Age {suspect.age}
              </span>
            </div>
            <p className="text-xs text-zinc-400 truncate">
              {suspect.occupation} · {suspect.relationshipToVictim}
            </p>
          </div>
        </div>

        {onOpenDossier && (
          <button
            onClick={() => onOpenDossier(suspect)}
            className="flex items-center gap-1.5 text-xs font-mono text-zinc-300 hover:text-amber-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">View</span> File
          </button>
        )}
      </div>

      {/* Stated Alibi Reference Ribbon */}
      <div className="bg-zinc-900/40 border-b border-zinc-800/80 px-4 sm:px-6 py-2.5 text-xs shrink-0 flex items-start gap-2">
        <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold shrink-0 mt-0.5">
          Claimed Alibi:
        </span>
        <p className="text-zinc-300 italic font-serif leading-relaxed line-clamp-2">
          &quot;{suspect.alibi}&quot;
        </p>
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
        {chatHistory.length === 0 ? (
          <div className="my-auto py-12 text-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <h4 className="text-sm font-bold text-zinc-200 mb-1">
              Begin Interrogating {suspect.name}
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              Ask about their whereabouts, timeline, or connections to physical evidence found at the crime scene.
            </p>

            {/* Quick Prompts */}
            <div className="space-y-1.5 text-left">
              <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold block mb-1">
                Suggested Lines of Questioning:
              </span>
              {QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickPrompt(prompt)}
                  disabled={!canAsk}
                  className="w-full text-left text-xs font-mono text-zinc-300 hover:text-amber-200 bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800 hover:border-amber-700/60 p-2.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  &rarr; &quot;{prompt}&quot;
                </button>
              ))}
            </div>
          </div>
        ) : (
          chatHistory.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-md ${
                  msg.role === "user"
                    ? "bg-amber-950/60 text-amber-100 border border-amber-800/60 rounded-br-none"
                    : "bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-bl-none font-serif"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1 text-[10px] font-mono opacity-60">
                  <span>{msg.role === "user" ? "Detective" : suspect.name}</span>
                </div>
                {msg.content}
              </div>
            </motion.div>
          ))
        )}

        {/* Loading / Typing Animation */}
        {state.isLoading && state.activeSuspectId === suspect.id && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-bl-none px-4 py-3 text-xs text-zinc-400 flex items-center gap-2">
              <span className="font-mono text-[10px] text-zinc-400">{suspect.name} is responding</span>
              <span className="inline-flex gap-1 text-amber-400">
                <span className="animate-bounce" style={{ animationDelay: "0ms" }}>•</span>
                <span className="animate-bounce" style={{ animationDelay: "150ms" }}>•</span>
                <span className="animate-bounce" style={{ animationDelay: "300ms" }}>•</span>
              </span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Question Input Form / Out of Questions Lock */}
      <div className="border-t border-zinc-800 bg-zinc-950/90 p-3 sm:p-4 shrink-0">
        {state.questionsRemaining <= 0 ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-red-950/40 border border-red-800/80 rounded-xl p-3 sm:p-3.5 text-xs text-red-300 font-mono">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-red-400 shrink-0" />
              <span>Question budget exhausted. You must proceed to indictment.</span>
            </div>
            <button
              onClick={() => dispatch({ type: "SHOW_ACCUSATION", payload: true })}
              className="bg-red-700 hover:bg-red-600 text-white font-bold uppercase tracking-wider px-4 py-2 rounded-lg transition-colors cursor-pointer w-full sm:w-auto text-center"
            >
              File Accusation
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Interrogate ${suspect.name}...`}
              disabled={!canAsk}
              className="flex-1 bg-zinc-900 border border-zinc-700/80 rounded-xl px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-amber-500 transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!canAsk || !input.trim()}
              className="bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-600 active:scale-95 text-white font-mono text-xs font-bold uppercase tracking-wider px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed shrink-0"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Ask</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
