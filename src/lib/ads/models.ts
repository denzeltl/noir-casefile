import { ChatGroq } from "@langchain/groq";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";

/**
 * Every model name the ad pipeline uses, in one place.
 * Checked 2026-11-04 against Groq's /models list; the Gemini name is the newest
 * Flash-Lite in /v1beta/models (higher free daily quota than Flash). Override via env.
 */
export const AD_MODELS = {
  writer: { provider: "groq", model: process.env.AD_WRITER_MODEL ?? "openai/gpt-oss-120b" },
  critic: { provider: "gemini", model: process.env.AD_CRITIC_MODEL ?? "gemini-3.5-flash-lite" },
  // Used when the primary provider is rate-limited, down, or not configured.
  groqFallback: { provider: "groq", model: "openai/gpt-oss-20b" },
  geminiFallback: { provider: "gemini", model: process.env.AD_CRITIC_MODEL ?? "gemini-3.5-flash-lite" },
} as const;

type ModelSpec = { provider: "groq" | "gemini"; model: string };

function groqKeys(): string[] {
  return [
    process.env.GROQ_API_KEY,
    process.env.GROQ_API_KEY_BACKUP,
    process.env.GROQ_API_KEY_2,
    ...(process.env.GROQ_API_KEYS?.split(",") ?? []),
  ]
    .map((k) => k?.trim())
    .filter((k): k is string => Boolean(k));
}

/**
 * Chat models to try in order for one spec: one per Groq key (same failover idea
 * as src/lib/groq.ts), or the single Gemini key. Empty if nothing is configured.
 */
export function chatModels(spec: ModelSpec, temperature: number): BaseChatModel[] {
  if (spec.provider === "groq") {
    return Array.from(new Set(groqKeys())).map(
      (apiKey) => new ChatGroq({ apiKey, model: spec.model, temperature, maxRetries: 0 })
    );
  }
  const apiKey = process.env.GOOGLE_API_KEY;
  return apiKey
    ? [new ChatGoogleGenerativeAI({ apiKey, model: spec.model, temperature, maxRetries: 0 })]
    : [];
}
