import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import type { AdBrief } from "./brief.ts";
import { AD_MODELS } from "./models.ts";
import { CritiqueSchema, HookSetSchema, type Hook, type ScoredHook } from "./schemas.ts";
import { structuredCall } from "./structured.ts";

export const MAX_LOOPS = 3;
export const PASS_SCORE = 7;

/**
 * Graph state. Only the spoiler-free brief ever enters it: the full Case
 * (solution, killer, alibis) is never passed to the graph.
 */
export const AdState = Annotation.Root({
  brief: Annotation<AdBrief>,
  hooks: Annotation<ScoredHook[]>({ reducer: (_, next) => next, default: () => [] }),
  feedback: Annotation<string | null>({ reducer: (_, next) => next, default: () => null }),
  loops: Annotation<number>({ reducer: (_, next) => next, default: () => 0 }),
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
export function afterCritic(state: State): "hookWriter" | typeof END {
  const best = state.hooks[0]?.score ?? 0;
  return best < PASS_SCORE && state.loops < MAX_LOOPS ? "hookWriter" : END;
}

export function buildAdGraph() {
  return new StateGraph(AdState)
    .addNode("hookWriter", hookWriter)
    .addNode("critic", critic)
    .addEdge(START, "hookWriter")
    .addEdge("hookWriter", "critic")
    .addConditionalEdges("critic", afterCritic, ["hookWriter", END])
    .compile();
}

/** writer + critic per loop, plus headroom. */
export const RECURSION_LIMIT = MAX_LOOPS * 2 + 4;
