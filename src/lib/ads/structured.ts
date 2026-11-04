import type { z } from "zod";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { chatModels } from "./models.ts";

type Spec = Parameters<typeof chatModels>[0];

function isRateLimitOrAuth(err: unknown): boolean {
  const e = err as { status?: number; message?: string };
  return (
    e?.status === 429 ||
    e?.status === 401 ||
    e?.status === 403 ||
    (e?.status ?? 0) >= 500 ||
    /rate[-_ ]?limit|quota|api key|resource.?exhausted/i.test(e?.message ?? "")
  );
}

/**
 * Structured call with provider failover: tries every model of `primary`, then
 * of `fallback` (Groq <-> Gemini). Rate-limit/auth/5xx errors move to the next
 * model. A schema/parse failure is retried once on the same model with the error
 * fed back; a second failure throws (the caller marks the run failed).
 */
export async function structuredCall<T extends z.ZodType>(opts: {
  schema: T;
  name: string;
  system: string;
  user: string;
  primary: Spec;
  fallback: Spec;
  temperature: number;
}): Promise<{ data: z.infer<T>; model: string }> {
  const candidates: { model: BaseChatModel; label: string }[] = [
    ...chatModels(opts.primary, opts.temperature).map((m) => ({ model: m, label: opts.primary.model })),
    ...chatModels(opts.fallback, opts.temperature).map((m) => ({ model: m, label: opts.fallback.model })),
  ];
  if (candidates.length === 0) throw new Error("No LLM provider configured (GROQ_API_KEY / GOOGLE_API_KEY).");

  let lastError: unknown;
  for (const { model, label } of candidates) {
    const runnable = model.withStructuredOutput(opts.schema, { name: opts.name });
    let user = opts.user;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const raw = await runnable.invoke([
          { role: "system", content: opts.system },
          { role: "user", content: user },
        ]);
        // Validate ourselves: providers don't all enforce the schema.
        const parsed = opts.schema.safeParse(raw);
        if (parsed.success) return { data: parsed.data, model: label };
        throw Object.assign(new Error(parsed.error.message), { parseError: true });
      } catch (err) {
        lastError = err;
        if (isRateLimitOrAuth(err)) {
          console.warn(`[ads] ${label} unavailable, trying next model:`, (err as Error).message?.slice(0, 120));
          break;
        }
        if (attempt === 0) {
          user = `${opts.user}\n\nYour previous answer was rejected: ${(err as Error).message?.slice(0, 800)}\nReturn output that matches the schema exactly.`;
          continue;
        }
        throw err;
      }
    }
  }
  throw lastError;
}
