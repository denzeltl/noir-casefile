import { Annotation, END, START, StateGraph, interrupt, type BaseCheckpointSaver } from "@langchain/langgraph";
import type { AdBrief } from "./brief.ts";
import { AD_MODELS } from "./models.ts";
import {
  CritiqueSchema,
  HookDecisionSchema,
  HookSetSchema,
  PASS_SCORE,
  RenderResultSchema,
  StoryboardSchema,
  type Storyboard,
  type Hook,
  type HookDecision,
  type ScoredHook,
} from "./schemas.ts";
import { structuredCall } from "./structured.ts";
import { toTrailerVariables, type TrailerVariables } from "./trailer.ts";

export const MAX_LOOPS = 3;
export { PASS_SCORE };

/**
 * Graph state. Only the spoiler-free brief ever enters it: the full Case
 * (solution, killer, alibis) is never passed to the graph.
 */
export const AdState = Annotation.Root({
  brief: Annotation<AdBrief>,
  hooks: Annotation<ScoredHook[]>({ reducer: (_, next) => next, default: () => [] }),
  feedback: Annotation<string | null>({ reducer: (_, next) => next, default: () => null }),
  loops: Annotation<number>({ reducer: (_, next) => next, default: () => 0 }),
  // Set once the admin picks (or edits) a hook at interrupt #1.
  chosenHook: Annotation<ScoredHook | null>({ reducer: (_, next) => next, default: () => null }),
  storyboard: Annotation<Storyboard | null>({ reducer: (_, next) => next, default: () => null }),
  // What the render worker feeds the HyperFrames template.
  trailer: Annotation<TrailerVariables | null>({ reducer: (_, next) => next, default: () => null }),
  videoUrl: Annotation<string | null>({ reducer: (_, next) => next, default: () => null }),
  // Node-by-node trail for the admin timeline.
  trail: Annotation<string[]>({ reducer: (a, b) => a.concat(b), default: () => [] }),
});

type State = typeof AdState.State;

const WRITER_SYSTEM = `You write scroll-stopping hooks for 15-second vertical (9:16) trailers for "Noir Casefile", a browser murder-mystery game where you interrogate AI suspects.
Rules:
- Hardboiled noir voice. Concrete images from the brief, no generic clichés.
- Never reveal or hint who the killer is. You don't know, and must not guess.
- Each script is ~35-45 words, readable as on-screen text, and ends inviting the viewer to solve it.
- Five hooks with clearly different angles.`;

const CRITIC_SYSTEM = `You are a blunt short-form video editor scoring trailer hooks for a noir murder-mystery game.
Score each hook 1-10 on: stops the scroll in the first 2 seconds, specific to this case, fits 15 seconds, makes you want to play.
7+ means you would ship it. Be strict: generic noir pastiche scores 5 or less. Never reward hooks that name or imply a culprit.`;

async function hookWriter(state: State): Promise<Partial<State>> {
  const rewrite = state.feedback
    ? `\n\nThis is rewrite #${state.loops}. The critic said:\n${state.feedback}\nKeep what scored well, fix the rest.`
    : "";
  const { data, model } = await structuredCall({
    schema: HookSetSchema,
    name: "hook_set",
    system: WRITER_SYSTEM,
    user: `Case brief (JSON):\n${JSON.stringify(state.brief, null, 2)}${rewrite}`,
    primary: AD_MODELS.writer,
    fallback: AD_MODELS.geminiFallback,
    temperature: 0.9,
  });
  return {
    hooks: data.hooks.map((h: Hook) => ({ ...h, score: 0, feedback: "" })),
    loops: state.loops + 1,
    trail: [`hookWriter:${model}`],
  };
}

async function critic(state: State): Promise<Partial<State>> {
  const hooks = state.hooks.map(({ id, hook, angle, script }) => ({ id, hook, angle, script }));
  const { data, model } = await structuredCall({
    schema: CritiqueSchema,
    name: "critique",
    system: CRITIC_SYSTEM,
    user: `Case: "${state.brief.title}" (${state.brief.setting})\n\nHooks:\n${JSON.stringify(hooks, null, 2)}`,
    primary: AD_MODELS.critic,
    fallback: AD_MODELS.groqFallback,
    temperature: 0.2,
  });
  const byId = new Map(data.scores.map((s) => [s.id, s]));
  const scored = state.hooks
    .map((h) => ({ ...h, score: byId.get(h.id)?.score ?? 0, feedback: byId.get(h.id)?.feedback ?? "" }))
    .sort((a, b) => b.score - a.score);
  const notes = scored.map((h) => `- ${h.id} (${h.score}/10): ${h.feedback}`).join("\n");
  return {
    hooks: scored,
    feedback: `${data.summary}\n${notes}`,
    trail: [`critic:${model}`],
  };
}

/** Loop back to the writer while the best hook is under PASS_SCORE, at most MAX_LOOPS writes. */
export function afterCritic(state: State): "hookWriter" | "pickHook" {
  const best = state.hooks[0]?.score ?? 0;
  return best < PASS_SCORE && state.loops < MAX_LOOPS ? "hookWriter" : "pickHook";
}

/**
 * Interrupt #1: pause until the admin chooses a hook, edits one, or asks for a
 * rewrite. The node re-runs from the top on resume, so nothing before
 * interrupt() may have side effects.
 */
async function pickHook(state: State): Promise<Partial<State>> {
  const decision = HookDecisionSchema.parse(interrupt({ kind: "pick_hook", hooks: state.hooks }));
  return applyHookDecision(state, decision);
}

export function applyHookDecision(state: State, decision: HookDecision): Partial<State> {
  if (decision.action === "rewrite") {
    return {
      feedback: `The producer asked for a rewrite: ${decision.note}\n\nLast critique:\n${state.feedback ?? "none"}`,
      chosenHook: null,
      trail: ["pickHook:rewrite"],
    };
  }
  const hook = state.hooks.find((h) => h.id === decision.hookId);
  if (!hook) throw new Error(`Unknown hook id ${decision.hookId}`);
  const chosen =
    decision.action === "edit" ? { ...hook, hook: decision.hook, script: decision.script } : hook;
  return { chosenHook: chosen, trail: [`pickHook:${decision.action}`] };
}

// A rewrite is one extra pass even when the auto-loop budget is spent.
function afterPick(state: State): "hookWriter" | "storyboardWriter" {
  return state.chosenHook ? "storyboardWriter" : "hookWriter";
}

const STORYBOARD_SYSTEM = `You storyboard 15-second vertical (9:16) trailers for "Noir Casefile", a browser murder-mystery game.
The template is fixed: frame 0 shows the hook (0-3s), then three 3-second shots, then the call to action (12-15s) over the suspects' names.
Rules:
- Every word is on-screen text, read in under 3 seconds: hook max 10 words, each shot max 9 words, CTA max 7 words.
- Build tension shot to shot. Use concrete things from the brief (places, clues, the victim), never generic noir filler.
- Never reveal or hint who the killer is. You don't know. Don't single out one suspect.
- Use each motif at most once. For a 'clue' shot, detail must be a clue name from the brief.`;

async function storyboardWriter(state: State): Promise<Partial<State>> {
  const hook = state.chosenHook!;
  const { data, model } = await structuredCall({
    schema: StoryboardSchema,
    name: "storyboard",
    system: STORYBOARD_SYSTEM,
    user: `Case brief (JSON):\n${JSON.stringify(state.brief, null, 2)}\n\nApproved hook: ${hook.hook}\nApproved script: ${hook.script}`,
    primary: AD_MODELS.writer,
    fallback: AD_MODELS.geminiFallback,
    temperature: 0.7,
  });
  return {
    storyboard: data,
    trailer: toTrailerVariables(data, state.brief),
    trail: [`storyboardWriter:${model}`],
  };
}

/**
 * Render handoff. Nothing renders on the server: the run waits here
 * (ad_runs.status = waiting_render) until the PC render worker uploads the MP4
 * and resumes with its URL. A failed render leaves the run paused here, so a
 * retry is just another resume.
 */
async function render(state: State): Promise<Partial<State>> {
  const result = RenderResultSchema.parse(interrupt({ kind: "render", trailer: state.trailer }));
  return { videoUrl: result.videoUrl, trail: ["render:done"] };
}

/** Without a checkpointer the graph still runs, but interrupt() can't pause it. */
export function buildAdGraph(checkpointer?: BaseCheckpointSaver) {
  return new StateGraph(AdState)
    .addNode("hookWriter", hookWriter)
    .addNode("critic", critic)
    .addNode("pickHook", pickHook)
    .addNode("storyboardWriter", storyboardWriter)
    .addNode("render", render)
    .addEdge(START, "hookWriter")
    .addEdge("hookWriter", "critic")
    .addConditionalEdges("critic", afterCritic, ["hookWriter", "pickHook"])
    .addConditionalEdges("pickHook", afterPick, ["hookWriter", "storyboardWriter"])
    .addEdge("storyboardWriter", "render")
    .addEdge("render", END)
    .compile({ checkpointer });
}

/** Per invoke: writer + critic per loop, the pick, plus headroom. */
export const RECURSION_LIMIT = MAX_LOOPS * 2 + 4;
