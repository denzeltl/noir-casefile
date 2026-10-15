"use client";

import { useState, useRef, useEffect } from "react";
import { useGame } from "@/context/GameContext";
import { Send, Lock, User, ShieldQuestion } from "lucide-react";

export default function InterrogationRoom() {
  const { state, interrogate } = useGame();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suspect = state.activeCase?.suspects.find(
    (s) => s.id === state.activeSuspectId
  );
  const chatHistory = suspect
    ? state.chatHistories[suspect.id] || []
    : [];
  const canAsk = state.questionsRemaining > 0 && !state.isLoading;

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !suspect || !canAsk) return;
    const question = input.trim();
    setInput("");
    await interrogate(suspect.id, question);
  };

  // No suspect selected
  if (!suspect) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-600">
        <div className="text-center">
          <ShieldQuestion size={48} className="mx-auto mb-3 text-zinc-700" />
          <p className="text-lg font-semibold">Select a suspect to interrogate</p>
          <p className="text-sm mt-1">Choose from the suspect cards on the left</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Suspect header */}
      <div className="px-5 py-3 border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-900/40 flex items-center justify-center">
            <User size={20} className="text-amber-400" />
          </div>
          <div>
            <h3 className="font-bold text-amber-100">{suspect.name}</h3>
            <p className="text-xs text-zinc-400">
              {suspect.occupation} — {suspect.relationshipToVictim}
            </p>
          </div>
        </div>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Alibi intro */}
        {chatHistory.length === 0 && (
          <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800 text-sm">
            <p className="text-zinc-500 uppercase text-xs tracking-wide mb-2">
              Suspect&apos;s Stated Alibi
            </p>
            <p className="text-zinc-300 italic">&quot;{suspect.alibi}&quot;</p>
          </div>
        )}

        {chatHistory.map((msg, i) => (
          <div
            key={i}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-amber-800/40 text-amber-100 border border-amber-700/30"
                  : "bg-zinc-800/80 text-zinc-200 border border-zinc-700/30"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {state.isLoading && state.activeSuspectId === suspect.id && (
          <div className="flex justify-start">
            <div className="bg-zinc-800/80 border border-zinc-700/30 rounded-lg px-4 py-2.5 text-sm text-zinc-400">
              <span className="inline-flex gap-1">
                <span className="animate-bounce" style={{ animationDelay: "0ms" }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: "150ms" }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: "300ms" }}>.</span>
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <form
        onSubmit={handleSubmit}
        className="px-5 py-3 border-t border-zinc-800 bg-zinc-950/80"
      >
        {state.questionsRemaining <= 0 ? (
          <div className="flex items-center justify-center gap-2 text-red-400 text-sm py-2">
            <Lock size={16} />
            <span>No questions remaining — make your accusation!</span>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask ${suspect.name} a question...`}
              disabled={!canAsk}
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-600 transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!canAsk || !input.trim()}
              className="bg-amber-700 hover:bg-amber-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-lg px-4 py-2.5 transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
