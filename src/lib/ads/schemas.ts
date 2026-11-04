import { z } from "zod";

/** A hook the critic scores at least this high is good enough to ship. */
export const PASS_SCORE = 7;

export const HookSchema = z.object({
  id: z.string().describe("Short id, e.g. h1"),
  hook: z.string().describe("The opening line on screen, max ~12 words"),
  angle: z.string().describe("The emotional angle in 2-4 words, e.g. 'locked-room dread'"),
  script: z
    .string()
    .describe("15-second voiceover/overlay script, ~35-45 words, ends with a call to play"),
});

export const HookSetSchema = z.object({
  hooks: z.array(HookSchema).length(5),
});

export const CritiqueSchema = z.object({
  scores: z
    .array(
      z.object({
        id: z.string().describe("The hook id being scored"),
        score: z.number().int().min(1).max(10),
        feedback: z.string().describe("One or two sentences: what works, what to fix"),
      })
    )
    .length(5),
  summary: z.string().describe("One sentence of overall direction for a rewrite"),
});

/** The admin's answer at interrupt #1 (body of the resume route). */
export const HookDecisionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("choose"), hookId: z.string().min(1) }),
  z.object({
    action: z.literal("edit"),
    hookId: z.string().min(1),
    hook: z.string().trim().min(1).max(160),
    script: z.string().trim().min(1).max(600),
  }),
  z.object({ action: z.literal("rewrite"), note: z.string().trim().min(3).max(500) }),
]);

export type HookDecision = z.infer<typeof HookDecisionSchema>;
export type Hook = z.infer<typeof HookSchema>;
export type HookSet = z.infer<typeof HookSetSchema>;
export type Critique = z.infer<typeof CritiqueSchema>;

/** A hook with the critic's verdict attached, as stored in ad_runs.hooks_json. */
export type ScoredHook = Hook & { score: number; feedback: string };
