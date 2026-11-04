import { test } from "node:test";
import assert from "node:assert/strict";
import { afterCritic, applyHookDecision, MAX_LOOPS, PASS_SCORE } from "./graph.ts";
import type { ScoredHook } from "./schemas.ts";

const hook = (id: string, score: number): ScoredHook => ({
  id,
  hook: `Hook ${id}`,
  angle: "dread",
  script: "Script.",
  score,
  feedback: "",
});

const state = (hooks: ScoredHook[], loops = 1) =>
  ({ brief: {} as never, hooks, feedback: "Too generic.", loops, chosenHook: null, trail: [] });

test("low scores loop back to the writer until the cap, then pause for a pick", () => {
  assert.equal(afterCritic(state([hook("h1", PASS_SCORE - 1)], 1)), "hookWriter");
  assert.equal(afterCritic(state([hook("h1", PASS_SCORE - 1)], MAX_LOOPS)), "pickHook");
  assert.equal(afterCritic(state([hook("h1", PASS_SCORE)], 1)), "pickHook");
});

test("choose and edit set the chosen hook; edit keeps the critic's score", () => {
  const s = state([hook("h1", 8), hook("h2", 6)]);
  assert.equal(applyHookDecision(s, { action: "choose", hookId: "h2" }).chosenHook?.id, "h2");
  const edited = applyHookDecision(s, { action: "edit", hookId: "h1", hook: "New line", script: "New script" });
  assert.deepEqual(
    { hook: edited.chosenHook?.hook, script: edited.chosenHook?.script, score: edited.chosenHook?.score },
    { hook: "New line", script: "New script", score: 8 }
  );
});

test("rewrite clears the pick and carries the producer's note to the writer", () => {
  const out = applyHookDecision(state([hook("h1", 8)]), { action: "rewrite", note: "Lead with the rain" });
  assert.equal(out.chosenHook, null);
  assert.match(out.feedback ?? "", /Lead with the rain/);
});

test("an unknown hook id is rejected", () => {
  assert.throws(() => applyHookDecision(state([hook("h1", 8)]), { action: "choose", hookId: "nope" }));
});
