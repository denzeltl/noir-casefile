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

/** Drawn backdrops the trailer template knows (video/index.html). */
export const MOTIFS = ["curtain", "rain", "spotlight", "clue", "board", "lineup"] as const;

/**
 * The trailer, slot by slot. Timings are fixed by the template: hook 0–3s,
 * then three shots of 3s (short cut, 15s) or four (long cut, 19s, for cases
 * with 4–5 suspects), then the call to action. The model only writes words
 * and picks a backdrop per shot; storyboardSchemaFor() pins the shot count.
 */
export const StoryboardSchema = z.object({
  hook: z.string().describe("Frame-0 line, max 10 words. Usually the chosen hook, tightened."),
  shots: z
    .array(
      z.object({
        overlay: z.string().describe("On-screen text for this 3-second shot, max 9 words"),
        motif: z
          .enum(MOTIFS)
          .describe("Backdrop: curtain, rain, spotlight, clue (one tagged evidence card), board (every clue pinned to a board) or lineup (every suspect's name)"),
        detail: z
          .string()
          .describe("For 'clue': the clue's name from the brief. Otherwise a 1-3 word caption, e.g. 'Chicago, 1927'"),
      })
    )
    .min(3)
    .max(4),
  cta: z.string().describe("Closing line, max 7 words, a dare to play, e.g. 'Can you name the killer?'"),
});

/** Cases with more suspects than this get the long cut (four shots, 19 s). */
export const SHORT_CUT_SUSPECTS = 3;

/** Shots in the trailer for a case with this many suspects. */
export function shotCountFor(suspects: number): 3 | 4 {
  return suspects > SHORT_CUT_SUSPECTS ? 4 : 3;
}

/** The storyboard schema with the shot count pinned for this case. */
export function storyboardSchemaFor(suspects: number) {
  const n = shotCountFor(suspects);
  return StoryboardSchema.extend({ shots: StoryboardSchema.shape.shots.length(n) });
}

/** Worker → graph at the render interrupt. Failures never resume the graph. */
export const RenderResultSchema = z.object({
  action: z.literal("rendered"),
  videoUrl: z.string().url(),
});

/** The admin's answer at interrupt #2, after watching the render. */
export const VideoDecisionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.enum(["approve", "rerender", "discard"]) }),
  // Rewrite the storyboard with the producer's note, then render again.
  z.object({ action: z.literal("revise"), note: z.string().trim().min(3).max(500) }),
]);

export type Motif = (typeof MOTIFS)[number];
export type Storyboard = z.infer<typeof StoryboardSchema>;
export type RenderResult = z.infer<typeof RenderResultSchema>;
export type VideoDecision = z.infer<typeof VideoDecisionSchema>;
