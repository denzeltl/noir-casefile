"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
} from "react";
import type { Case, ChatMessage, Difficulty } from "@/types/case";
import { DIFFICULTY_CONFIGS } from "@/types/case";

const STORAGE_KEY = "noir_casefile_save_v1";

// ─── State ──────────────────────────────────────────────────────────────────
interface GameState {
  activeCase: Case | null;
  difficulty: Difficulty;
  questionsRemaining: number;
  chatHistories: Record<string, ChatMessage[]>;
  activeSuspectId: string | null;
  isLoading: boolean;
  error: string | null;
  showAccusation: boolean;
  showBriefing: boolean;
  isHydrated: boolean;
  verdict: {
    correct: boolean;
    correctSuspect: boolean;
    correctWeapon: boolean;
    actualKillerName: string;
    actualWeapon: string;
    solution: string;
    verdict: string;
  } | null;
}

const initialState: GameState = {
  activeCase: null,
  difficulty: "medium",
  questionsRemaining: DIFFICULTY_CONFIGS.medium.maxQuestions,
  chatHistories: {},
  activeSuspectId: null,
  isLoading: false,
  error: null,
  showAccusation: false,
  showBriefing: false,
  isHydrated: false,
  verdict: null,
};

// ─── Actions ────────────────────────────────────────────────────────────────
type GameAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_DIFFICULTY"; payload: Difficulty }
  | { type: "SET_CASE"; payload: { caseData: Case; difficulty: Difficulty } }
  | { type: "SELECT_SUSPECT"; payload: string }
  | { type: "ADD_MESSAGE"; payload: { suspectId: string; message: ChatMessage } }
  | { type: "DECREMENT_QUESTIONS" }
  | { type: "SHOW_ACCUSATION"; payload: boolean }
  | { type: "SHOW_BRIEFING"; payload: boolean }
  | { type: "SET_VERDICT"; payload: GameState["verdict"] }
  | { type: "RESTORE_STATE"; payload: Partial<GameState> }
  | { type: "SET_HYDRATED" }
  | { type: "RESET" };

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "SET_DIFFICULTY":
      return { ...state, difficulty: action.payload };
    case "SET_CASE": {
      const histories: Record<string, ChatMessage[]> = {};
      action.payload.caseData.suspects.forEach((s) => {
        histories[s.id] = [];
      });
      const config = DIFFICULTY_CONFIGS[action.payload.difficulty];
      return {
        ...initialState,
        activeCase: action.payload.caseData,
        difficulty: action.payload.difficulty,
        questionsRemaining: config.maxQuestions,
        chatHistories: histories,
        activeSuspectId: action.payload.caseData.suspects[0]?.id || null,
        showBriefing: true,
        isHydrated: true,
      };
    }
    case "SELECT_SUSPECT":
      return { ...state, activeSuspectId: action.payload };
    case "ADD_MESSAGE":
      return {
        ...state,
        chatHistories: {
          ...state.chatHistories,
          [action.payload.suspectId]: [
            ...(state.chatHistories[action.payload.suspectId] || []),
            action.payload.message,
          ],
        },
      };
    case "DECREMENT_QUESTIONS":
      return {
        ...state,
        questionsRemaining: Math.max(0, state.questionsRemaining - 1),
      };
    case "SHOW_ACCUSATION":
      return { ...state, showAccusation: action.payload };
    case "SHOW_BRIEFING":
      return { ...state, showBriefing: action.payload };
    case "SET_VERDICT":
      return { ...state, verdict: action.payload, showAccusation: false };
    case "RESTORE_STATE":
      return {
        ...state,
        ...action.payload,
        isLoading: false,
        error: null,
        isHydrated: true,
      };
    case "SET_HYDRATED":
      return { ...state, isHydrated: true };
    case "RESET":
      return {
        ...initialState,
        difficulty: state.difficulty,
        isHydrated: true,
      };
    default:
      return state;
  }
}

// ─── Context ────────────────────────────────────────────────────────────────
interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  generateCase: (difficulty?: Difficulty) => Promise<void>;
  interrogate: (suspectId: string, question: string) => Promise<void>;
  submitAccusation: (
    suspectId: string,
    weapon: string,
    evidence: string
  ) => Promise<void>;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // 1. Hydrate state from localStorage on initial browser load
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.activeCase) {
          dispatch({ type: "RESTORE_STATE", payload: parsed });
          return;
        }
      }
    } catch (e) {
      console.error("Failed to restore saved casefile from localStorage", e);
    }
    dispatch({ type: "SET_HYDRATED" });
  }, []);

  // 2. Synchronize active state changes to localStorage
  useEffect(() => {
    if (!state.isHydrated) return;
    try {
      if (state.activeCase) {
        const toSave = {
          activeCase: state.activeCase,
          difficulty: state.difficulty,
          questionsRemaining: state.questionsRemaining,
          chatHistories: state.chatHistories,
          activeSuspectId: state.activeSuspectId,
          showBriefing: state.showBriefing,
          verdict: state.verdict,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.error("Failed to persist casefile to localStorage", e);
    }
  }, [
    state.isHydrated,
    state.activeCase,
    state.difficulty,
    state.questionsRemaining,
    state.chatHistories,
    state.activeSuspectId,
    state.showBriefing,
    state.verdict,
  ]);

  const generateCase = useCallback(
    async (difficulty: Difficulty = "medium") => {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });

      try {
        const res = await fetch("/api/generate-case", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ difficulty }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to generate case");
        }
        const caseData: Case = await res.json();
        dispatch({ type: "SET_CASE", payload: { caseData, difficulty } });
      } catch (err) {
        dispatch({
          type: "SET_ERROR",
          payload: err instanceof Error ? err.message : "Unknown error",
        });
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    []
  );

  const interrogate = useCallback(
    async (suspectId: string, question: string) => {
      if (!state.activeCase || state.questionsRemaining <= 0) return;

      const suspect = state.activeCase.suspects.find((s) => s.id === suspectId);
      if (!suspect) return;

      dispatch({
        type: "ADD_MESSAGE",
        payload: { suspectId, message: { role: "user", content: question } },
      });
      dispatch({ type: "DECREMENT_QUESTIONS" });
      dispatch({ type: "SET_LOADING", payload: true });

      try {
        const res = await fetch("/api/interrogate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            suspect,
            question,
            difficulty: state.difficulty,
            chatHistory: state.chatHistories[suspectId] || [],
            caseContext: {
              title: state.activeCase.title,
              setting: state.activeCase.setting,
              victimName: state.activeCase.victim.name,
              weapon: state.activeCase.weapon,
              clues: state.activeCase.clues,
            },
          }),
        });

        if (!res.ok) throw new Error("Failed to get response from suspect");

        const data = await res.json();
        dispatch({
          type: "ADD_MESSAGE",
          payload: {
            suspectId,
            message: { role: "assistant", content: data.reply },
          },
        });
      } catch (err) {
        dispatch({
          type: "SET_ERROR",
          payload: err instanceof Error ? err.message : "Interrogation failed",
        });
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    [
      state.activeCase,
      state.questionsRemaining,
      state.chatHistories,
      state.difficulty,
    ]
  );

  const submitAccusation = useCallback(
    async (suspectId: string, weapon: string, evidence: string) => {
      if (!state.activeCase) return;
      dispatch({ type: "SET_LOADING", payload: true });

      try {
        const res = await fetch("/api/interrogate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accusedSuspectId: suspectId,
            accusedWeapon: weapon,
            evidence,
            caseData: state.activeCase,
          }),
        });

        if (!res.ok) throw new Error("Failed to submit accusation");

        const verdict = await res.json();
        dispatch({ type: "SET_VERDICT", payload: verdict });
      } catch (err) {
        dispatch({
          type: "SET_ERROR",
          payload: err instanceof Error ? err.message : "Accusation failed",
        });
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    [state.activeCase]
  );

  return (
    <GameContext.Provider
      value={{
        state,
        dispatch,
        generateCase,
        interrogate,
        submitAccusation,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used inside <GameProvider>");
  return ctx;
}
